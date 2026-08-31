from __future__ import annotations

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
    validate_attachment,
    validate_contact_type,
    validate_email,
    validate_message,
    validate_priority,
    validate_status,
    validate_subject,
    require_non_empty,
)


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
    # TODO: add reCAPTCHA or Turnstile spam protection

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

    _notify_emails(contact)
    return contact


def upload_attachment(*, contact_id: str, file_storage: Any) -> dict[str, str]:
    filename = file_storage.filename or "attachment.bin"
    content_type = file_storage.mimetype or "application/octet-stream"
    file_bytes = file_storage.read()
    extension = validate_attachment(filename, content_type, len(file_bytes))

    safe_name = filename.replace("\\", "_").replace("/", "_")
    object_path = f"contacts/{contact_id}/{uuid.uuid4().hex}.{extension}"

    client = get_supabase_client()
    client.storage.from_("attachments").upload(
        object_path,
        file_bytes,
        {"content-type": content_type, "upsert": "false"},
    )
    public_url = client.storage.from_("attachments").get_public_url(object_path)
    try:
        signed = client.storage.from_("attachments").create_signed_url(
            object_path,
            60 * 60 * 24 * 30,
        )
        url = (
            (signed or {}).get("signedURL")
            or (signed or {}).get("signedUrl")
            or public_url
        )
    except Exception:
        url = public_url

    return {"url": url, "name": safe_name, "path": object_path}


def _notify_emails(contact: dict[str, Any]) -> None:
    import logging

    from services.mail_service import admin_inbox, is_smtp_configured

    logger = logging.getLogger(__name__)
    errors: list[str] = []

    if not is_smtp_configured():
        logger.warning(
            "Mail not configured (SMTP_HOST / provider key missing). "
            "Contact saved without sending auto-reply or admin notification. "
            "id=%s",
            contact.get("id"),
        )
        return

    admin_email = admin_inbox()
    if admin_email:
        try:
            subject, body = build_admin_notification(contact)
            send_email(to=admin_email, subject=subject, text_body=body)
        except (MailConfigError, MailSendError) as exc:
            errors.append(f"admin:{exc}")
            logger.warning("Admin notification mail failed: %s", exc)
    else:
        logger.warning(
            "ADMIN_EMAIL / ADMIN_CONTACT_EMAIL is not set. "
            "Skipping admin notification. id=%s",
            contact.get("id"),
        )

    try:
        subject, body = build_auto_reply(contact)
        send_email(to=contact["email"], subject=subject, text_body=body)
    except (MailConfigError, MailSendError) as exc:
        errors.append(f"auto_reply:{exc}")
        logger.warning("Auto-reply mail failed: %s", exc)

    if errors:
        # Soft-fail: inquiry is already saved
        logger.warning(
            "Contact mail soft-fail id=%s issues=%s",
            contact.get("id"),
            "; ".join(errors),
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
        query = query.or_(
            f"company_name.ilike.%{keyword}%,"
            f"contact_name.ilike.%{keyword}%,"
            f"email.ilike.%{keyword}%,"
            f"subject.ilike.%{keyword}%,"
            f"message.ilike.%{keyword}%"
        )

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
