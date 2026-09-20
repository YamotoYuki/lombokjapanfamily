from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from services.mail_service import (
    MailConfigError,
    MailSendError,
    build_admin_notification,
    build_auto_reply,
    send_email,
)
from services.supabase_service import get_supabase_client
from utils.validators import (
    ValidationError,
    build_or_filter,
    require_non_empty,
    sanitize_search_term,
    validate_attachment,
    validate_contact_type,
    validate_email,
    validate_message,
    validate_priority,
    validate_status,
    validate_subject,
    verify_file_signature,
)


logger = logging.getLogger(__name__)


class ContactNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _first_or_none(data: Any) -> dict[str, Any] | None:
    if not data:
        return None
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


def create_contact(
    payload: dict[str, Any],
    *,
    attachment_file: Any | None = None,
) -> dict[str, Any]:
    # Spam protection: Cloudflare Turnstile (see turnstile_service / contact_routes)

    contact_name = require_non_empty(
        payload.get("contact_name"),
        "担当者名を入力してください",
    )
    email = validate_email(payload.get("email"))
    subject = validate_subject(payload.get("subject"))
    message = validate_message(payload.get("message"))
    contact_type = validate_contact_type(payload.get("contact_type"))
    company_name = (payload.get("company_name") or "").strip() or None
    phone = (payload.get("phone") or "").strip() or None

    client = get_supabase_client()
    row = {
        "company_name": company_name,
        "contact_name": contact_name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "contact_type": contact_type,
        "status": "new",
        "priority": "normal",
    }

    result = client.table("contacts").insert(row).execute()
    contact = _first_or_none(result.data)
    if not contact:
        raise RuntimeError("お問い合わせの送信に失敗しました")

    if attachment_file and getattr(attachment_file, "filename", None):
        try:
            uploaded = upload_attachment(
                contact_id=contact["id"],
                file_storage=attachment_file,
            )
        except Exception:
            client.table("contacts").delete().eq("id", contact["id"]).execute()
            raise
        updated = (
            client.table("contacts")
            .update(
                {
                    "attachment_url": uploaded["url"],
                    "attachment_name": uploaded["name"],
                }
            )
            .eq("id", contact["id"])
            .execute()
        )
        contact = _first_or_none(updated.data) or {
            **contact,
            "attachment_url": uploaded["url"],
            "attachment_name": uploaded["name"],
        }

    # Fire-and-forget: admin + auto-reply are two sequential SMTP sends (up
    # to 30s each, see mail_service._send_smtp's timeout=30) that used to
    # block this response for up to ~60s and trip the frontend's 60000ms
    # axios timeout before the client ever saw a reply — even though the
    # inquiry row above was already committed. Moving it off the request
    # thread fixes that latency, but it is a best-effort improvement, not a
    # delivery guarantee: see _send_notification_emails_background's
    # docstring for what this does NOT protect against.
    threading.Thread(
        target=_send_notification_emails_background,
        args=(contact,),
        daemon=True,
        name=f"contact-mail-{contact.get('id') or 'unknown'}",
    ).start()
    return contact


def upload_attachment(*, contact_id: str, file_storage: Any) -> dict[str, str]:
    filename = file_storage.filename or "attachment.bin"
    content_type = file_storage.mimetype or "application/octet-stream"
    file_bytes = file_storage.read()
    extension = validate_attachment(filename, content_type, len(file_bytes))
    verify_file_signature(file_bytes, extension)

    safe_name = filename.replace("\\", "_").replace("/", "_")
    object_path = f"contacts/{contact_id}/{uuid.uuid4().hex}.{extension}"

    client = get_supabase_client()
    client.storage.from_("attachments").upload(
        object_path,
        file_bytes,
        {"content-type": content_type, "upsert": "false"},
    )
    # Prefer short-lived signed URL (1h). Avoid 30-day durable links on public create.
    public_url = client.storage.from_("attachments").get_public_url(object_path)
    try:
        signed = client.storage.from_("attachments").create_signed_url(
            object_path,
            60 * 60,
        )
        url = (
            (signed or {}).get("signedURL")
            or (signed or {}).get("signedUrl")
            or public_url
        )
    except Exception:
        url = public_url

    return {"url": url, "name": safe_name, "path": object_path}


def _send_notification_emails_background(contact: dict[str, Any]) -> None:
    """Thread entry point for create_contact()'s fire-and-forget mail send.

    No Flask app/request context or ORM session is touched here — contact
    is a plain dict already fetched from Supabase's REST API before this
    thread starts, and mail_service reads config straight from os.environ,
    so there is nothing request-scoped to leak or reuse unsafely.

    What this does NOT give you, and what a caller must not assume:
    - No delivery guarantee. This is a daemon thread: if the gunicorn
      worker is killed (deploy, restart, OOM, crash) while a send is in
      flight, the thread dies with it mid-SMTP-conversation and nothing
      records that the notification never went out.
    - No retry. A single failed attempt (this call) is the only attempt;
      _notify_emails already treats mail failures as soft — logged, never
      raised — by design, but nothing re-queues them.
    - No dedup across resubmits. If a visitor submits twice (e.g. retrying
      after an error that didn't actually fail server-side), each call
      creates its own contact row and fires its own pair of emails; there
      is currently no idempotency key or send-state column to detect that.
    The inquiry itself is safe regardless: the Supabase insert in
    create_contact() happens synchronously, before this thread is ever
    started, so a lost or duplicated email never loses (or silently drops)
    the underlying inquiry. If guaranteed, exactly-once delivery is
    required, this needs to move to a persisted queue (e.g. an outbox
    table processed by a worker/cron) instead of an in-process thread.
    """
    try:
        _notify_emails(contact)
    except Exception:
        # _notify_emails already catches and logs everything it expects
        # (MailConfigError/MailSendError, plus a catch-all at its own
        # boundary) — this is a last-resort net for anything that still
        # escapes it, so a background-thread bug is never silently lost to
        # stderr alone. logger.exception() records the full traceback.
        logger.exception(
            "[MAIL] background notification thread crashed id=%s",
            contact.get("id"),
        )


def _notify_emails(contact: dict[str, Any]) -> None:
    errors: list[str] = []

    try:
        from services.mail_service import admin_inbox, is_smtp_configured
    except Exception as exc:
        logger.warning(
            "[MAIL] Mail helpers unavailable; contact saved without email. "
            "id=%s err=%s",
            contact.get("id"),
            exc,
        )
        return

    try:
        if not is_smtp_configured():
            logger.warning(
                "[MAIL] SMTP not configured. Contact emails will be skipped. "
                "id=%s",
                contact.get("id"),
            )
            return

        admin_email = admin_inbox()
        if admin_email:
            try:
                subject, body = build_admin_notification(contact)
                send_email(to=admin_email, subject=subject, text_body=body)
                logger.info(
                    "[MAIL] Admin notification sent to %s id=%s",
                    admin_email,
                    contact.get("id"),
                )
            except (MailConfigError, MailSendError) as exc:
                errors.append(f"admin:{exc}")
                logger.warning(
                    "[MAIL] Failed to send admin notification: %s",
                    exc,
                )
        else:
            logger.warning(
                "[MAIL] ADMIN_CONTACT_EMAIL not set. "
                "Admin notification emails will be skipped. id=%s",
                contact.get("id"),
            )

        try:
            subject, body = build_auto_reply(contact)
            send_email(to=contact["email"], subject=subject, text_body=body)
            logger.info(
                "[MAIL] Auto reply sent to %s id=%s",
                contact.get("email"),
                contact.get("id"),
            )
        except (MailConfigError, MailSendError) as exc:
            errors.append(f"auto_reply:{exc}")
            logger.warning("[MAIL] Failed to send auto reply: %s", exc)

        if errors:
            # Soft-fail: inquiry is already saved
            logger.warning(
                "[MAIL] Contact mail soft-fail id=%s issues=%s",
                contact.get("id"),
                "; ".join(errors),
            )
    except Exception:
        # Never fail the public submit after the row is stored.
        # logger.exception (not .warning) so an unanticipated bug here
        # still leaves a full traceback in the logs, not just a message.
        logger.exception(
            "[MAIL] unexpected error id=%s",
            contact.get("id"),
        )


def list_contacts(
    *,
    keyword: str | None = None,
    status: str | None = None,
    contact_type: str | None = None,
    priority: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    client = get_supabase_client()
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    query = client.table("contacts").select("*", count="exact")

    if status:
        query = query.eq("status", validate_status(status))
    else:
        query = query.neq("status", "archived")

    if contact_type:
        query = query.eq("contact_type", validate_contact_type(contact_type))
    if priority:
        query = query.eq("priority", validate_priority(priority))
    if keyword:
        keyword_term = sanitize_search_term(keyword)
        keyword_filter = build_or_filter(
            keyword_term,
            ["company_name", "contact_name", "email", "subject", "message"],
        )
        if keyword_filter:
            query = query.or_(keyword_filter)

    result = (
        query.order("created_at", desc=True)
        .range(start, end)
        .execute()
    )
    items = result.data or []
    return {
        "items": items,
        "total": result.count or len(items),
        "page": page,
        "limit": limit,
    }


def get_contact(contact_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    result = (
        client.table("contacts")
        .select("*")
        .eq("id", contact_id)
        .limit(1)
        .execute()
    )
    contact = _first_or_none(result.data)
    if not contact:
        raise ContactNotFoundError("お問い合わせ詳細の取得に失敗しました")
    return contact


def update_contact(contact_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "status",
        "priority",
        "assigned_to",
        "internal_note",
        "responded_at",
    }
    data: dict[str, Any] = {}
    for key in allowed:
        if key not in payload:
            continue
        value = payload[key]
        if key == "status":
            data[key] = validate_status(value)
            if value == "completed" and "responded_at" not in payload:
                data["responded_at"] = _now_iso()
        elif key == "priority":
            data[key] = validate_priority(value)
        elif key == "assigned_to":
            data[key] = value or None
        elif key == "internal_note":
            data[key] = value
        elif key == "responded_at":
            data[key] = value

    if not data:
        raise ValidationError("更新する項目がありません")

    client = get_supabase_client()
    result = client.table("contacts").update(data).eq("id", contact_id).execute()
    contact = _first_or_none(result.data)
    if not contact:
        raise ContactNotFoundError("お問い合わせ詳細の取得に失敗しました")
    return contact


def archive_contact(contact_id: str) -> dict[str, Any]:
    return update_contact(contact_id, {"status": "archived"})


def hard_delete_contact(contact_id: str) -> dict[str, Any]:
    contact = get_contact(contact_id)
    client = get_supabase_client()
    client.table("contacts").delete().eq("id", contact_id).execute()
    return contact


def get_contact_stats() -> dict[str, Any]:
    client = get_supabase_client()
    rows = (
        client.table("contacts")
        .select("id,status,contact_type,created_at")
        .neq("status", "archived")
        .execute()
        .data
        or []
    )

    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    total = len(rows)
    new_count = sum(1 for row in rows if row.get("status") == "new")
    in_progress_count = sum(1 for row in rows if row.get("status") == "in_progress")
    completed_count = sum(1 for row in rows if row.get("status") == "completed")
    sponsor_related_count = sum(
        1
        for row in rows
        if row.get("contact_type") in {"sponsor", "collaboration", "media"}
    )

    monthly_count = 0
    for row in rows:
        created = row.get("created_at")
        if not created:
            continue
        try:
            created_at = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
            if created_at >= month_start:
                monthly_count += 1
        except Exception:
            continue

    return {
        "total": total,
        "new_count": new_count,
        "in_progress_count": in_progress_count,
        "completed_count": completed_count,
        "monthly_count": monthly_count,
        "sponsor_related_count": sponsor_related_count,
    }
