from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Any

import requests

logger = logging.getLogger(__name__)


class MailConfigError(RuntimeError):
    pass


class MailSendError(RuntimeError):
    pass


SITE_URL = "https://www.lombokjapanfamily.com"


def _provider() -> str:
    return (os.getenv("MAIL_PROVIDER") or "smtp").strip().lower()


def _from_address() -> str:
    return (
        os.getenv("EMAIL_FROM")
        or os.getenv("SMTP_FROM")
        or os.getenv("MAIL_FROM")
        or "noreply@lombokjapanfamily.com"
    ).strip()


def _smtp_user() -> str:
    return (
        os.getenv("SMTP_USER", "").strip()
        or os.getenv("SMTP_USERNAME", "").strip()
    )


def _smtp_password() -> str:
    # Gmail app passwords are often copied with spaces; SMTP expects continuous chars.
    return os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()


def admin_inbox() -> str | None:
    """Admin destination for new-contact notifications."""
    value = (
        os.getenv("ADMIN_CONTACT_EMAIL") or os.getenv("ADMIN_EMAIL") or ""
    ).strip()
    return value or None


def smtp_missing_keys() -> list[str]:
    """SMTP keys required for sending (empty when provider is not smtp)."""
    if _provider() not in {"", "smtp"}:
        return []
    missing: list[str] = []
    if not os.getenv("SMTP_HOST", "").strip():
        missing.append("SMTP_HOST")
    if not _smtp_user():
        missing.append("SMTP_USER")
    if not _smtp_password():
        missing.append("SMTP_PASSWORD")
    return missing


def is_mail_configured() -> bool:
    """True when the active provider has enough credentials to send."""
    provider = _provider()
    if provider == "resend":
        return bool(os.getenv("RESEND_API_KEY", "").strip())
    if provider == "sendgrid":
        return bool(os.getenv("SENDGRID_API_KEY", "").strip())
    return not smtp_missing_keys()


# Backward-compatible alias used by contact_service
def is_smtp_configured() -> bool:
    return is_mail_configured()


def log_mail_startup(app_logger: logging.Logger | None = None) -> None:
    """Emit startup WARNING/INFO about optional contact mail config.

    Never logs SMTP_PASSWORD or API keys.
    """
    log = app_logger or logger
    provider = _provider()

    if provider == "resend":
        if os.getenv("RESEND_API_KEY", "").strip():
            log.info("[MAIL] Resend configured.")
        else:
            log.warning(
                "[MAIL] Resend not configured (RESEND_API_KEY missing). "
                "Contact emails will be skipped."
            )
    elif provider == "sendgrid":
        if os.getenv("SENDGRID_API_KEY", "").strip():
            log.info("[MAIL] SendGrid configured.")
        else:
            log.warning(
                "[MAIL] SendGrid not configured (SENDGRID_API_KEY missing). "
                "Contact emails will be skipped."
            )
    else:
        # Explicit Gmail SMTP readiness: USER / PASSWORD (HOST defaults to gmail)
        missing_auth = [
            key
            for key in ("SMTP_USER", "SMTP_PASSWORD")
            if (
                (key == "SMTP_USER" and not _smtp_user())
                or (
                    key == "SMTP_PASSWORD"
                    and not _smtp_password()
                )
            )
        ]
        missing = smtp_missing_keys()
        if missing:
            log.warning(
                "[MAIL] SMTP not configured. Contact emails will be skipped."
            )
            if missing_auth:
                log.warning(
                    "[MAIL] Missing SMTP credentials: %s",
                    ",".join(missing_auth),
                )
        else:
            log.info("[MAIL] SMTP configured")

    if not admin_inbox():
        log.warning(
            "[MAIL] ADMIN_CONTACT_EMAIL not set. "
            "Admin notification emails will be skipped."
        )
    else:
        log.info("[MAIL] Admin inbox configured.")


def _redact_secrets(message: str) -> str:
    """Strip credentials from error strings before logging/raising."""
    redacted = message
    for secret in (
        _smtp_password(),
        os.getenv("SMTP_PASSWORD", "").strip(),
        os.getenv("RESEND_API_KEY", "").strip(),
        os.getenv("SENDGRID_API_KEY", "").strip(),
    ):
        if secret and secret in redacted:
            redacted = redacted.replace(secret, "***")
    return redacted


def send_email(*, to: str, subject: str, text_body: str) -> None:
    if not to:
        raise MailConfigError("送信先メールアドレスが設定されていません。")

    provider = _provider()
    if provider == "resend":
        _send_resend(to=to, subject=subject, text_body=text_body)
    elif provider == "sendgrid":
        _send_sendgrid(to=to, subject=subject, text_body=text_body)
    else:
        _send_smtp(to=to, subject=subject, text_body=text_body)


def _send_smtp(*, to: str, subject: str, text_body: str) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT") or "587")
    user = _smtp_user()
    password = _smtp_password()
    from_addr = _from_address()

    missing = smtp_missing_keys()
    if missing:
        raise MailConfigError(
            f"SMTP 未設定: {', '.join(missing)}"
        )

    # EmailMessage + charset=utf-8 keeps Japanese readable in Gmail.
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_addr
    message["To"] = to
    message.set_content(text_body, charset="utf-8")

    try:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.ehlo()
            if port != 25:
                smtp.starttls()
                smtp.ehlo()
            if user:
                smtp.login(user, password)
            smtp.send_message(message)
    except Exception as exc:
        raise MailSendError(
            f"SMTP送信に失敗しました: {_redact_secrets(str(exc))}"
        ) from None


def _send_resend(*, to: str, subject: str, text_body: str) -> None:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key:
        raise MailConfigError("RESEND_API_KEY が設定されていません。")

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": _from_address(),
            "to": [to],
            "subject": subject,
            "text": text_body,
        },
        timeout=30,
    )
    if response.status_code >= 400:
        raise MailSendError(f"Resend送信に失敗しました: {response.text}")


def _send_sendgrid(*, to: str, subject: str, text_body: str) -> None:
    api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    if not api_key:
        raise MailConfigError("SENDGRID_API_KEY が設定されていません。")

    response = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": _from_address()},
            "subject": subject,
            "content": [{"type": "text/plain", "value": text_body}],
        },
        timeout=30,
    )
    if response.status_code >= 400:
        raise MailSendError(f"SendGrid送信に失敗しました: {response.text}")


def build_admin_notification(contact: dict[str, Any]) -> tuple[str, str]:
    """Admin alert — plain text with inquiry details."""
    subject = "【お問い合わせ】新しいお問い合わせが届きました"
    body = f"""お名前:
{contact.get('contact_name') or '—'}

メール:
{contact.get('email') or '—'}

件名:
{contact.get('subject') or '—'}

内容:
{contact.get('message') or '—'}

送信日時:
{contact.get('created_at') or '—'}
"""
    return subject, body


def build_auto_reply(contact: dict[str, Any]) -> tuple[str, str]:
    """User receipt mail — plain text, no inquiry body."""
    name = str(contact.get("contact_name") or "").strip() or "お客様"
    subject = "お問い合わせありがとうございます｜Lombok-Japan Family"
    body = f"""{name} 様

この度は Lombok-Japan Family へお問い合わせいただき、
誠にありがとうございます。

お問い合わせ内容を正常に受け付けいたしました。

担当者が内容を確認し、順次ご対応させていただきます。
お問い合わせ内容によっては、ご返信までに数日お時間をいただく場合がございますので、あらかじめご了承ください。

Lombok-Japan Family は、日本とインドネシア・ロンボク島をつなぐ家族チャンネルとして、
YouTube や公式ウェブサイトを通じて様々な情報を発信しております。

今後とも Lombok-Japan Family をよろしくお願いいたします。

----------------------------------------
Lombok-Japan Family

公式サイト
{SITE_URL}

YouTube Channel
https://www.youtube.com/@LombokJapanFamily
----------------------------------------

※このメールはシステムによる自動送信メールです。
※本メールへの返信には対応しておりません。
※お心当たりのない場合は、本メールを破棄してください。
"""
    return subject, body
