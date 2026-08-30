from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from typing import Any

import requests


class MailConfigError(RuntimeError):
    pass


class MailSendError(RuntimeError):
    pass


def _provider() -> str:
    return (os.getenv("MAIL_PROVIDER") or "smtp").strip().lower()


def _from_address() -> str:
    return (
        os.getenv("SMTP_FROM") or os.getenv("MAIL_FROM") or "noreply@lombokjapan.family"
    ).strip()


def is_smtp_configured() -> bool:
    """True when SMTP host is present (minimum required for smtp provider)."""
    provider = _provider()
    if provider == "resend":
        return bool(os.getenv("RESEND_API_KEY", "").strip())
    if provider == "sendgrid":
        return bool(os.getenv("SENDGRID_API_KEY", "").strip())
    return bool(os.getenv("SMTP_HOST", "").strip())


def admin_inbox() -> str:
    return (
        os.getenv("ADMIN_EMAIL", "").strip()
        or os.getenv("ADMIN_CONTACT_EMAIL", "").strip()
    )


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
    user = (
        os.getenv("SMTP_USERNAME", "").strip()
        or os.getenv("SMTP_USER", "").strip()
    )
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_addr = _from_address()

    if not host:
        raise MailConfigError("SMTP_HOST が設定されていません。")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_addr
    message["To"] = to
    message.set_content(text_body)

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
        raise MailSendError(f"SMTP送信に失敗しました: {exc}") from exc


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


CONTACT_TYPE_LABELS = {
    "general": "一般お問い合わせ",
    "sponsor": "企業案件",
    "collaboration": "コラボ依頼",
    "media": "取材依頼",
    "other": "その他",
}


def _contact_type_label(contact: dict[str, Any]) -> str:
    raw = contact.get("contact_type")
    return CONTACT_TYPE_LABELS.get(raw, raw or "—")


def build_admin_notification(contact: dict[str, Any]) -> tuple[str, str]:
    name = contact.get("contact_name") or "—"
    subject = "【Lombok-Japan Family】新しいお問い合わせが届きました"
    body = f"""新しいお問い合わせが届きました。

お名前:
{name}

メール:
{contact.get("email") or "—"}

種別:
{_contact_type_label(contact)}

件名:
{contact.get("subject") or "—"}

内容:
{contact.get("message") or "—"}

管理画面より詳細をご確認ください。
"""
    return subject, body


def build_auto_reply(contact: dict[str, Any]) -> tuple[str, str]:
    name = contact.get("contact_name") or "お客様"
    subject = "【Lombok-Japan Family】お問い合わせありがとうございます"
    body = f"""{name} 様

この度は Lombok-Japan Familyへお問い合わせいただき、誠にありがとうございます。

お問い合わせ内容を確かに受け付けいたしました。

家族一同、とても嬉しく思っております。

内容を確認のうえ、担当者より順次ご連絡いたしますので、今しばらくお待ちください。

なお、お問い合わせ内容によっては、お返事まで数日お時間をいただく場合がございます。

━━━━━━━━━━━━━━━━━━━

【お問い合わせ内容】

お名前：
{name}

メールアドレス：
{contact.get("email") or "—"}

お問い合わせ種別：
{_contact_type_label(contact)}

件名：
{contact.get("subject") or "—"}

内容：
{contact.get("message") or "—"}

━━━━━━━━━━━━━━━━━━━

本メールは受付完了の自動送信メールです。

Lombok-Japan Family
日本とインドネシアをつなぐファミリーYouTubeチャンネル

今後ともよろしくお願いいたします。
"""
    return subject, body
