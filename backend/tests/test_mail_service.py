from __future__ import annotations

from email.message import EmailMessage
from logging import getLogger
from unittest.mock import MagicMock, patch

import pytest
import requests

from services import mail_service


@pytest.fixture(autouse=True)
def _clear_mail_env(monkeypatch: pytest.MonkeyPatch):
    for key in (
        "MAIL_PROVIDER",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM",
        "EMAIL_FROM",
        "MAIL_FROM",
        "RESEND_API_KEY",
        "SENDGRID_API_KEY",
        "ADMIN_EMAIL",
        "ADMIN_CONTACT_EMAIL",
    ):
        monkeypatch.delenv(key, raising=False)


def test_is_mail_configured_false_when_empty():
    assert mail_service.is_mail_configured() is False
    assert mail_service.is_smtp_configured() is False
    assert mail_service.smtp_missing_keys() == [
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
    ]


def test_is_mail_configured_false_when_host_only(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.gmail.com")
    assert mail_service.is_mail_configured() is False
    assert "SMTP_USER" in mail_service.smtp_missing_keys()


def test_is_mail_configured_smtp(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    assert mail_service.is_mail_configured() is True


def test_is_mail_configured_resend(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MAIL_PROVIDER", "resend")
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    assert mail_service.is_mail_configured() is True


def test_from_address_prefers_email_from(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("EMAIL_FROM", "hello@lombokjapanfamily.site")
    monkeypatch.setenv("SMTP_FROM", "smtp@example.com")
    assert mail_service._from_address() == "hello@lombokjapanfamily.site"


def test_from_address_default_uses_owned_domain():
    """The project owns lombokjapanfamily.site, not .com — the fallback
    default must never point at a domain that isn't actually registered."""
    assert mail_service._from_address() == "noreply@lombokjapanfamily.site"


def test_admin_inbox():
    assert mail_service.admin_inbox() is None


def test_admin_inbox_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_CONTACT_EMAIL", "ops@example.com")
    assert mail_service.admin_inbox() == "ops@example.com"


def test_admin_inbox_falls_back_to_admin_email(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    assert mail_service.admin_inbox() == "admin@example.com"


def test_reply_to_address_defaults_to_admin_inbox(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_CONTACT_EMAIL", "ops@example.com")
    assert mail_service.reply_to_address() == "ops@example.com"


def test_reply_to_address_override(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_CONTACT_EMAIL", "ops@example.com")
    monkeypatch.setenv("MAIL_REPLY_TO", "support@example.com")
    assert mail_service.reply_to_address() == "support@example.com"


def test_reply_to_address_none_when_unset():
    assert mail_service.reply_to_address() is None


def test_build_auto_reply_content():
    subject, body = mail_service.build_auto_reply(
        {"contact_name": "山田太郎", "email": "user@example.com", "message": "秘密の本文"}
    )
    assert subject == "お問い合わせありがとうございます｜Lombok-Japan Family"
    assert "山田太郎 様" in body
    assert "誠にありがとうございます" in body
    assert "正常に受け付けいたしました" in body
    assert "日本とインドネシア・ロンボク島" in body
    assert "https://lombokjapanfamily.site" in body
    assert "https://www.youtube.com/@LombokJapanFamily" in body
    assert "システムによる自動送信メールです" in body
    assert "本メールに直接ご返信いただけます" in body
    # Must not include inquiry body
    assert "秘密の本文" not in body
    assert "user@example.com" not in body


def test_build_auto_reply_fallback_name():
    subject, body = mail_service.build_auto_reply({})
    assert "お客様 様" in body
    assert "Lombok-Japan Family" in subject
    assert "自動送信メールです" in body


def test_build_admin_notification_keeps_details():
    subject, body = mail_service.build_admin_notification(
        {
            "contact_name": "山田",
            "email": "user@example.com",
            "contact_type": "sponsor",
            "subject": "件名テスト",
            "message": "本文テスト",
            "created_at": "2026-08-31T00:00:00Z",
        }
    )
    assert subject == "【お問い合わせ】新しいお問い合わせが届きました"
    assert "お名前:\n山田" in body
    assert "メール:\nuser@example.com" in body
    assert "件名:\n件名テスト" in body
    assert "内容:\n本文テスト" in body
    assert "送信日時:\n2026-08-31T00:00:00Z" in body


def test_smtp_error_redacts_password(monkeypatch: pytest.MonkeyPatch):
    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def ehlo(self):
            return None

        def starttls(self):
            return None

        def login(self, user, password):
            raise RuntimeError(f"auth failed: {password}")

        def send_message(self, message: EmailMessage):
            return None

    monkeypatch.setenv("SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "super-secret-app-password")
    monkeypatch.setenv("EMAIL_FROM", "user@example.com")
    monkeypatch.setattr(mail_service, "_IPv4SMTP", FakeSMTP)

    with pytest.raises(mail_service.MailSendError) as exc_info:
        mail_service._send_smtp(
            to="user@example.com",
            subject="t",
            text_body="b",
        )
    assert "super-secret-app-password" not in str(exc_info.value)
    assert "***" in str(exc_info.value)


def test_smtp_message_uses_utf8(monkeypatch: pytest.MonkeyPatch):
    captured: dict[str, EmailMessage] = {}

    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def ehlo(self):
            return None

        def starttls(self):
            return None

        def login(self, user, password):
            return None

        def send_message(self, message: EmailMessage):
            captured["message"] = message

    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "noreply@lombokjapanfamily.site")
    monkeypatch.setattr(mail_service, "_IPv4SMTP", FakeSMTP)

    mail_service._send_smtp(
        to="user@example.com",
        subject="【テスト】件名",
        text_body="こんにちは",
    )

    msg = captured["message"]
    assert msg["Subject"] == "【テスト】件名"
    assert msg["To"] == "user@example.com"
    charset = msg.get_body(preferencelist=("plain",)).get_content_charset()  # type: ignore[union-attr]
    assert charset and charset.lower() == "utf-8"
    assert "こんにちは" in msg.get_content()


def test_log_mail_startup_warns_when_unconfigured(caplog: pytest.LogCaptureFixture):
    log = getLogger("test.mail.startup")
    with caplog.at_level("WARNING", logger="test.mail.startup"):
        mail_service.log_mail_startup(log)
    assert any("SMTP not configured" in r.message for r in caplog.records)
    assert any("ADMIN_CONTACT_EMAIL not set" in r.message for r in caplog.records)


def test_smtp_failure_logs_full_traceback_with_stage_markers(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    """Standing production diagnostic logging: a failure must log which
    stage was reached (connecting/starttls) and capture the full traceback
    via logger.exception, not just the summarized message the caller logs
    separately — and must never log the password."""

    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def ehlo(self):
            return None

        def starttls(self):
            raise OSError("Network is unreachable")

    monkeypatch.setenv("SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "super-secret-app-password")
    monkeypatch.setenv("EMAIL_FROM", "user@example.com")
    monkeypatch.setattr(mail_service, "_IPv4SMTP", FakeSMTP)

    with caplog.at_level("INFO"):
        with pytest.raises(mail_service.MailSendError):
            mail_service._send_smtp(to="user@example.com", subject="t", text_body="b")

    messages = [r.message for r in caplog.records]
    assert any("SMTP connecting" in m for m in messages)
    assert any("SMTP starttls" in m for m in messages)
    error_records = [r for r in caplog.records if r.levelname == "ERROR"]
    assert any("SMTP send failed" in r.message for r in error_records)
    assert any(r.exc_info for r in error_records)
    assert not any("super-secret-app-password" in m for m in messages)


# --- Resend / SendGrid (HTTPS API) ---------------------------------------


def _fake_response(status_code: int, text: str = "") -> MagicMock:
    response = MagicMock()
    response.status_code = status_code
    response.text = text
    return response


def test_send_resend_requires_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MAIL_PROVIDER", "resend")
    with pytest.raises(mail_service.MailConfigError):
        mail_service._send_resend(to="user@example.com", subject="t", text_body="b")


def test_send_resend_success(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    monkeypatch.setenv("EMAIL_FROM", "noreply@lombokjapanfamily.site")
    captured: dict = {}

    def _fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return _fake_response(200)

    with patch("services.mail_service.requests.post", side_effect=_fake_post):
        mail_service._send_resend(to="user@example.com", subject="件名", text_body="本文")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer re_test_key"
    assert captured["json"]["from"] == "noreply@lombokjapanfamily.site"
    assert captured["json"]["to"] == ["user@example.com"]
    assert captured["timeout"] == 30
    # The API key must never appear in the outgoing body.
    assert "re_test_key" not in str(captured["json"])


def test_send_resend_http_error_raises_and_redacts_key(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    with patch(
        "services.mail_service.requests.post",
        return_value=_fake_response(422, "invalid payload re_test_key"),
    ):
        with pytest.raises(mail_service.MailSendError) as exc_info:
            mail_service._send_resend(to="user@example.com", subject="t", text_body="b")
    assert "422" in str(exc_info.value)
    assert "re_test_key" not in str(exc_info.value)
    assert "***" in str(exc_info.value)


def test_send_resend_network_error_is_wrapped(monkeypatch: pytest.MonkeyPatch):
    """A connection-level failure (DNS/timeout/refused) must become a
    MailSendError like every other failure mode — not propagate as a raw
    requests exception, which would skip contact_service's per-email
    error handling and stop the auto-reply from ever being attempted."""
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    with patch(
        "services.mail_service.requests.post",
        side_effect=requests.exceptions.ConnectionError("Network is unreachable"),
    ):
        with pytest.raises(mail_service.MailSendError):
            mail_service._send_resend(to="user@example.com", subject="t", text_body="b")


def test_send_sendgrid_network_error_is_wrapped(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SENDGRID_API_KEY", "sg_test_key")
    with patch(
        "services.mail_service.requests.post",
        side_effect=requests.exceptions.Timeout("timed out"),
    ):
        with pytest.raises(mail_service.MailSendError):
            mail_service._send_sendgrid(to="user@example.com", subject="t", text_body="b")


# --- Reply-To --------------------------------------------------------------


def test_smtp_sets_reply_to_header(monkeypatch: pytest.MonkeyPatch):
    captured: dict[str, EmailMessage] = {}

    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def ehlo(self):
            return None

        def starttls(self):
            return None

        def login(self, user, password):
            return None

        def send_message(self, message: EmailMessage):
            captured["message"] = message

    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setattr(mail_service, "_IPv4SMTP", FakeSMTP)

    mail_service._send_smtp(
        to="user@example.com",
        subject="t",
        text_body="b",
        reply_to="admin@example.com",
    )
    assert captured["message"]["Reply-To"] == "admin@example.com"


def test_send_resend_includes_reply_to(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    captured: dict = {}

    def _fake_post(url, headers=None, json=None, timeout=None):
        captured["json"] = json
        return _fake_response(200)

    with patch("services.mail_service.requests.post", side_effect=_fake_post):
        mail_service._send_resend(
            to="user@example.com",
            subject="t",
            text_body="b",
            reply_to="admin@example.com",
        )

    assert captured["json"]["reply_to"] == ["admin@example.com"]


def test_send_resend_omits_reply_to_when_not_given(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    captured: dict = {}

    def _fake_post(url, headers=None, json=None, timeout=None):
        captured["json"] = json
        return _fake_response(200)

    with patch("services.mail_service.requests.post", side_effect=_fake_post):
        mail_service._send_resend(to="user@example.com", subject="t", text_body="b")

    assert "reply_to" not in captured["json"]


def test_send_sendgrid_includes_reply_to(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SENDGRID_API_KEY", "sg_test_key")
    captured: dict = {}

    def _fake_post(url, headers=None, json=None, timeout=None):
        captured["json"] = json
        return _fake_response(202)

    with patch("services.mail_service.requests.post", side_effect=_fake_post):
        mail_service._send_sendgrid(
            to="user@example.com",
            subject="t",
            text_body="b",
            reply_to="admin@example.com",
        )

    assert captured["json"]["reply_to"] == {"email": "admin@example.com"}


def test_send_email_routes_reply_to_through_provider_dispatch(
    monkeypatch: pytest.MonkeyPatch,
):
    """send_email() is the single public entry point contact_service calls
    — confirm it actually forwards reply_to to whichever provider function
    is selected, not just that the provider functions accept it."""
    monkeypatch.setenv("MAIL_PROVIDER", "resend")
    monkeypatch.setenv("RESEND_API_KEY", "re_test_key")
    with patch("services.mail_service._send_resend") as mocked:
        mail_service.send_email(
            to="user@example.com",
            subject="t",
            text_body="b",
            reply_to="admin@example.com",
        )
    assert mocked.call_args.kwargs["reply_to"] == "admin@example.com"
