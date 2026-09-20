from __future__ import annotations

import threading
import time
from unittest.mock import MagicMock, patch

import pytest

from services import contact_service


@pytest.fixture
def sample_contact() -> dict:
    return {
        "id": "c-1",
        "contact_name": "山田",
        "email": "user@example.com",
        "contact_type": "general",
        "subject": "テスト",
        "message": "本文",
        "created_at": "2026-09-01T00:00:00Z",
    }


def test_notify_emails_skips_when_smtp_missing(
    sample_contact: dict, caplog: pytest.LogCaptureFixture
):
    with patch("services.mail_service.is_smtp_configured", return_value=False):
        with caplog.at_level("WARNING"):
            contact_service._notify_emails(sample_contact)
    assert any(
        "SMTP not configured" in r.message for r in caplog.records
    )


def test_notify_emails_soft_fails_auto_reply(
    sample_contact: dict, caplog: pytest.LogCaptureFixture
):
    with (
        patch("services.mail_service.is_smtp_configured", return_value=True),
        patch("services.mail_service.admin_inbox", return_value="admin@example.com"),
        patch(
            "services.contact_service.send_email",
            side_effect=[None, contact_service.MailSendError("boom")],
        ),
    ):
        with caplog.at_level("WARNING"):
            contact_service._notify_emails(sample_contact)

    assert any("Failed to send auto reply" in r.message for r in caplog.records)


def test_notify_emails_skips_admin_when_inbox_missing(
    sample_contact: dict, caplog: pytest.LogCaptureFixture
):
    sent: list[str] = []

    def _fake_send(*, to: str, subject: str, text_body: str) -> None:
        sent.append(to)

    with (
        patch("services.mail_service.is_smtp_configured", return_value=True),
        patch("services.mail_service.admin_inbox", return_value=None),
        patch("services.contact_service.send_email", side_effect=_fake_send),
    ):
        with caplog.at_level("WARNING"):
            contact_service._notify_emails(sample_contact)

    assert sent == ["user@example.com"]
    assert any("ADMIN_CONTACT_EMAIL not set" in r.message for r in caplog.records)


def test_notify_emails_happy_path_sends_both(sample_contact: dict):
    """Admin notification and auto-reply are independent sends: both must
    fire when nothing fails, not just whichever happens to run first."""
    sent: list[str] = []

    def _fake_send(*, to: str, subject: str, text_body: str) -> None:
        sent.append(to)

    with (
        patch("services.mail_service.is_smtp_configured", return_value=True),
        patch("services.mail_service.admin_inbox", return_value="admin@example.com"),
        patch("services.contact_service.send_email", side_effect=_fake_send),
    ):
        contact_service._notify_emails(sample_contact)

    assert sent == ["admin@example.com", "user@example.com"]


def test_notify_emails_admin_failure_does_not_block_auto_reply(
    sample_contact: dict, caplog: pytest.LogCaptureFixture
):
    """The inverse of test_notify_emails_soft_fails_auto_reply: admin send
    fails first, auto-reply must still be attempted independently."""
    sent: list[str] = []

    def _fake_send(*, to: str, subject: str, text_body: str) -> None:
        if to == "admin@example.com":
            raise contact_service.MailSendError("smtp down")
        sent.append(to)

    with (
        patch("services.mail_service.is_smtp_configured", return_value=True),
        patch("services.mail_service.admin_inbox", return_value="admin@example.com"),
        patch("services.contact_service.send_email", side_effect=_fake_send),
    ):
        with caplog.at_level("WARNING"):
            contact_service._notify_emails(sample_contact)

    assert sent == ["user@example.com"]
    assert any("Failed to send admin notification" in r.message for r in caplog.records)


def test_background_wrapper_logs_unexpected_exception(
    sample_contact: dict, caplog: pytest.LogCaptureFixture
):
    """_send_notification_emails_background is the last-resort safety net
    for the background thread: even a bug that isn't one of the anticipated
    Mail*Error types must still be caught and logged, never silently lost."""
    with patch(
        "services.contact_service._notify_emails",
        side_effect=RuntimeError("unexpected bug"),
    ):
        with caplog.at_level("ERROR"):
            contact_service._send_notification_emails_background(sample_contact)

    error_records = [r for r in caplog.records if r.levelname == "ERROR"]
    assert any(
        "background notification thread crashed" in r.message
        for r in error_records
    )
    # logger.exception() must capture the traceback, not just the message.
    assert any(r.exc_info for r in error_records)


def _mock_contact_insert(client: MagicMock, contact_id: str = "c-thread-1") -> None:
    client.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[
            {
                "id": contact_id,
                "contact_name": "山田",
                "email": "user@example.com",
                "contact_type": "general",
                "subject": "テスト",
                "message": "本文",
            }
        ]
    )


def test_create_contact_returns_before_mail_send_completes():
    """The core fix under test: the HTTP-facing call must not block on
    mail delivery. Simulates a slow SMTP send via a threading.Event and
    asserts create_contact() returns long before that event is released."""
    mail_started = threading.Event()
    release_mail = threading.Event()
    call_count = {"n": 0}

    def _slow_notify(contact: dict) -> None:
        call_count["n"] += 1
        mail_started.set()
        # Bound the wait so a real bug fails the test instead of hanging CI.
        release_mail.wait(timeout=5)

    with (
        patch("services.contact_service.get_supabase_client") as mocked_client,
        patch("services.contact_service._notify_emails", side_effect=_slow_notify),
    ):
        client = MagicMock()
        mocked_client.return_value = client
        _mock_contact_insert(client)

        started_at = time.monotonic()
        contact = contact_service.create_contact(
            {
                "contact_name": "山田",
                "email": "user@example.com",
                "subject": "テスト",
                "message": "本文",
                "contact_type": "general",
            }
        )
        elapsed = time.monotonic() - started_at

    try:
        assert contact["id"] == "c-thread-1"
        # Real slow SMTP sends take up to ~30s each; returning this fast
        # proves the response did not wait on _notify_emails at all.
        assert elapsed < 2.0
        # The background thread should have been scheduled, even if it
        # hasn't necessarily reached _notify_emails the instant we check.
        assert mail_started.wait(timeout=5)
        assert call_count["n"] == 1
    finally:
        release_mail.set()


def test_create_contact_starts_background_mail_exactly_once():
    """No duplicate SMTP sends: create_contact() must schedule the
    notification thread exactly once per call, not zero or multiple times."""
    with (
        patch("services.contact_service.get_supabase_client") as mocked_client,
        patch(
            "services.contact_service._send_notification_emails_background"
        ) as mocked_bg,
    ):
        client = MagicMock()
        mocked_client.return_value = client
        _mock_contact_insert(client, contact_id="c-thread-2")

        contact_service.create_contact(
            {
                "contact_name": "山田",
                "email": "user@example.com",
                "subject": "テスト",
                "message": "本文",
                "contact_type": "general",
            }
        )

    assert mocked_bg.call_count == 1
    (called_contact,), _kwargs = mocked_bg.call_args
    assert called_contact["id"] == "c-thread-2"


def test_create_contact_succeeds_even_when_mail_raises(
    caplog: pytest.LogCaptureFixture,
):
    """A saved inquiry must never be undone or hidden from the caller just
    because the best-effort notification thread failed."""
    with (
        patch("services.contact_service.get_supabase_client") as mocked_client,
        patch(
            "services.contact_service._notify_emails",
            side_effect=RuntimeError("smtp exploded"),
        ),
    ):
        client = MagicMock()
        mocked_client.return_value = client
        _mock_contact_insert(client, contact_id="c-thread-3")

        with caplog.at_level("ERROR"):
            contact = contact_service.create_contact(
                {
                    "contact_name": "山田",
                    "email": "user@example.com",
                    "subject": "テスト",
                    "message": "本文",
                    "contact_type": "general",
                }
            )
            # create_contact() returns as soon as the row is saved; give the
            # daemon thread a brief, bounded moment to run and log before
            # asserting on caplog, instead of racing it.
            for _ in range(50):
                if any(
                    "background notification thread crashed" in r.message
                    for r in caplog.records
                ):
                    break
                time.sleep(0.05)

    assert contact["id"] == "c-thread-3"
    assert any(
        "background notification thread crashed" in r.message
        for r in caplog.records
    )
