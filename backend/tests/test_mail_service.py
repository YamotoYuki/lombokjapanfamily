from __future__ import annotations

from email.message import EmailMessage

import pytest

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


def test_is_mail_configured_smtp(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    assert mail_service.is_mail_configured() is True


def test_is_mail_configured_resend(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MAIL_PROVIDER", "resend")
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    assert mail_service.is_mail_configured() is True


def test_from_address_prefers_email_from(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("EMAIL_FROM", "hello@lombokjapanfamily.com")
    monkeypatch.setenv("SMTP_FROM", "smtp@example.com")
    assert mail_service._from_address() == "hello@lombokjapanfamily.com"


def test_admin_inbox():
    assert mail_service.admin_inbox() is None


def test_admin_inbox_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    assert mail_service.admin_inbox() == "admin@example.com"


def test_build_auto_reply_content():
    subject, body = mail_service.build_auto_reply(
        {"contact_name": "山田太郎", "email": "user@example.com", "message": "秘密の本文"}
    )
    assert subject == "【Lombok-Japan Family】お問い合わせありがとうございます"
    assert "山田太郎 様" in body
    assert "お問い合わせ内容を受け付けました" in body
    assert "このメールは自動送信されています" in body
    assert "https://www.lombokjapanfamily.com" in body
    assert "YouTube" in body
    assert "Instagram" in body
    assert "TikTok" in body
    assert "Facebook" in body
    # Must not include inquiry body
    assert "秘密の本文" not in body
    assert "user@example.com" not in body


def test_build_auto_reply_fallback_name():
    subject, body = mail_service.build_auto_reply({})
    assert "お客様 様" in body
    assert subject.startswith("【Lombok-Japan Family】")


def test_build_admin_notification_keeps_details():
    subject, body = mail_service.build_admin_notification(
        {
            "company_name": "ACME",
            "contact_name": "山田",
            "email": "user@example.com",
            "phone": "090",
            "contact_type": "sponsor",
            "subject": "件名テスト",
            "message": "本文テスト",
            "attachment_url": None,
            "created_at": "2026-08-31T00:00:00Z",
        }
    )
    assert "新しいお問い合わせ" in subject
    assert "山田" in body
    assert "user@example.com" in body
    assert "企業案件" in body
    assert "本文テスト" in body


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
    monkeypatch.setenv("EMAIL_FROM", "noreply@lombokjapanfamily.com")
    monkeypatch.setattr(mail_service.smtplib, "SMTP", FakeSMTP)

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
