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
    user = os.getenv("SMTP_USER", "").strip()
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


def build_admin_notification(contact: dict[str, Any]) -> tuple[str, str]:
    subject = "【Lombok-Japan Family】新しいお問い合わせが届きました"
    body = f"""新しいお問い合わせが届きました。

会社名: {contact.get("company_name") or "—"}
担当者名: {contact.get("contact_name")}
メールアドレス: {contact.get("email")}
電話番号: {contact.get("phone") or "—"}
問い合わせ種別: {CONTACT_TYPE_LABELS.get(contact.get("contact_type"), contact.get("contact_type"))}
件名: {contact.get("subject")}

内容:
{contact.get("message")}

添付ファイル: {contact.get("attachment_url") or "なし"}
受信日時: {contact.get("created_at")}
"""
    return subject, body


def build_auto_reply(contact: dict[str, Any]) -> tuple[str, str]:
    subject = "お問い合わせありがとうございます｜Lombok-Japan Family"
    body = f"""{contact.get("contact_name")} 様

お問い合わせありがとうございます。
内容を確認後、担当者よりご連絡いたします。

このメールは自動送信です。

---
Lombok-Japan Family
"""
    return subject, body
