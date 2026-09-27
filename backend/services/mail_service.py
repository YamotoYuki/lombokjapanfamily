from __future__ import annotations

import logging
import os
import smtplib
import socket
from email.message import EmailMessage
from typing import Any

import requests

logger = logging.getLogger(__name__)


class MailConfigError(RuntimeError):
    pass


class MailSendError(RuntimeError):
    pass


class _IPv4SMTP(smtplib.SMTP):
    """smtplib.SMTP that connects over IPv4 only.

    Some PaaS containers (observed on Render) advertise an IPv6 address
    with no working outbound route to it. getaddrinfo() still returns
    Gmail's AAAA record, smtplib tries it first, and the connection fails
    immediately with OSError: [Errno 101] Network is unreachable — a
    routing failure, not an auth/credentials problem. Overriding
    _get_socket() is the same extension point smtplib.SMTP_SSL itself
    overrides upstream, so this doesn't touch any private internals beyond
    what the stdlib already treats as its customization hook. self._host
    (what starttls() sends as server_hostname for the TLS handshake and
    certificate check) is set by SMTP.connect() from the host argument
    before this is ever called, so it stays "smtp.gmail.com" — TLS
    verification is unaffected.
    """

    def _get_socket(self, host, port, timeout):
        last_err: OSError | None = None
        for family, socktype, proto, _canonname, sockaddr in socket.getaddrinfo(
            host, port, socket.AF_INET, socket.SOCK_STREAM
        ):
            sock: socket.socket | None = None
            try:
                sock = socket.socket(family, socktype, proto)
                if timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                    sock.settimeout(timeout)
                if self.source_address:
                    sock.bind(self.source_address)
                sock.connect(sockaddr)
                return sock
            except OSError as exc:
                last_err = exc
                if sock is not None:
                    sock.close()
        if last_err is not None:
            raise last_err
        raise OSError(f"No IPv4 address found for {host}")


SITE_URL = "https://lombokjapanfamily.site"


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


def reply_to_address() -> str | None:
    """Reply-To for the visitor-facing auto-reply — MAIL_REPLY_TO overrides,
    otherwise the admin inbox, so hitting "reply" on the auto-reply reaches
    a human instead of the noreply From address."""
    override = os.getenv("MAIL_REPLY_TO", "").strip()
    return override or admin_inbox()


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


def send_email(
    *, to: str, subject: str, text_body: str, reply_to: str | None = None
) -> None:
    if not to:
        raise MailConfigError("送信先メールアドレスが設定されていません。")

    provider = _provider()
    if provider == "resend":
        _send_resend(to=to, subject=subject, text_body=text_body, reply_to=reply_to)
    elif provider == "sendgrid":
        _send_sendgrid(to=to, subject=subject, text_body=text_body, reply_to=reply_to)
    else:
        _send_smtp(to=to, subject=subject, text_body=text_body, reply_to=reply_to)


def _send_smtp(
    *, to: str, subject: str, text_body: str, reply_to: str | None = None
) -> None:
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
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(text_body, charset="utf-8")

    # Standing diagnostic logging: stage markers + a full-traceback log on
    # failure, so a production error shows exactly which SMTP step failed
    # (connect / STARTTLS / login / send) in Render's own log stream,
    # instead of only the one-line summary contact_service._notify_emails
    # already logs at WARNING. Never logs the password or message body —
    # only host/port/whether a username was configured. Kept permanently
    # since it's the only way to tell a blocked port apart from an auth
    # failure from the logs alone.
    try:
        logger.info("[MAIL] SMTP connecting host=%s port=%s", host, port)
        with _IPv4SMTP(host, port, timeout=30) as smtp:
            smtp.ehlo()
            if port != 25:
                logger.info("[MAIL] SMTP starttls")
                smtp.starttls()
                smtp.ehlo()
            if user:
                logger.info("[MAIL] SMTP login user_set=%s", bool(user))
                smtp.login(user, password)
            logger.info("[MAIL] SMTP send_message")
            smtp.send_message(message)
        logger.info("[MAIL] SMTP send ok host=%s port=%s", host, port)
    except Exception as exc:
        logger.exception(
            "[MAIL] SMTP send failed host=%s port=%s user_set=%s",
            host,
            port,
            bool(user),
        )
        raise MailSendError(
            f"SMTP送信に失敗しました: {_redact_secrets(str(exc))}"
        ) from None


def _send_resend(
    *, to: str, subject: str, text_body: str, reply_to: str | None = None
) -> None:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key:
        raise MailConfigError("RESEND_API_KEY が設定されていません。")

    body: dict[str, Any] = {
        "from": _from_address(),
        "to": [to],
        "subject": subject,
        "text": text_body,
    }
    if reply_to:
        body["reply_to"] = [reply_to]

    # Standing diagnostic logging, same intent as _send_smtp's above: never
    # logs the API key (redacted via _redact_secrets), only enough to tell
    # a network-level failure apart from an API-level rejection.
    logger.info("[MAIL] Resend sending")
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        # A connection-level failure (DNS/timeout/refused) must still raise
        # MailConfigError/MailSendError, not a raw requests exception —
        # contact_service._notify_emails only catches those two types per
        # send, so an uncaught exception here would abort the *other*
        # independent send (admin notification vs. auto-reply) too.
        logger.exception("[MAIL] Resend request failed")
        raise MailSendError(
            f"Resend送信に失敗しました: {_redact_secrets(str(exc))}"
        ) from None

    if response.status_code >= 400:
        logger.error(
            "[MAIL] Resend send failed status=%s", response.status_code
        )
        raise MailSendError(
            f"Resend送信に失敗しました(status={response.status_code}): "
            f"{_redact_secrets(response.text)}"
        )
    logger.info("[MAIL] Resend send ok status=%s", response.status_code)


def _send_sendgrid(
    *, to: str, subject: str, text_body: str, reply_to: str | None = None
) -> None:
    api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    if not api_key:
        raise MailConfigError("SENDGRID_API_KEY が設定されていません。")

    body: dict[str, Any] = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": _from_address()},
        "subject": subject,
        "content": [{"type": "text/plain", "value": text_body}],
    }
    if reply_to:
        body["reply_to"] = {"email": reply_to}

    logger.info("[MAIL] SendGrid sending")
    try:
        response = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        logger.exception("[MAIL] SendGrid request failed")
        raise MailSendError(
            f"SendGrid送信に失敗しました: {_redact_secrets(str(exc))}"
        ) from None

    if response.status_code >= 400:
        logger.error(
            "[MAIL] SendGrid send failed status=%s", response.status_code
        )
        raise MailSendError(
            f"SendGrid送信に失敗しました(status={response.status_code}): "
            f"{_redact_secrets(response.text)}"
        )
    logger.info("[MAIL] SendGrid send ok status=%s", response.status_code)


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
※お問い合わせについて追加でご連絡がある場合は、本メールに直接ご返信いただけます。
※お心当たりのない場合は、本メールを破棄してください。
"""
    return subject, body
