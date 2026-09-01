from __future__ import annotations

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
