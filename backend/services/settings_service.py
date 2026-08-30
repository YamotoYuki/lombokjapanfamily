from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from services.audit_service import write_audit_log
from services.storage_service import read_settings_asset_file, upload_public_image
from services.supabase_service import get_supabase_client
from utils.validators import ValidationError

SETTINGS_BUCKET = "settings-assets"

EDITABLE_FIELDS = {
    "site_name",
    "site_description",
    "logo_url",
    "favicon_url",
    "contact_email",
    "contact_phone",
    "contact_address",
    "youtube_channel_url",
    "instagram_url",
    "tiktok_url",
    "facebook_url",
    "x_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "og_image_url",
    "ga4_measurement_id",
    "google_tag_manager_id",
    "maintenance_mode",
}

URL_FIELDS = {
    "logo_url",
    "favicon_url",
    "youtube_channel_url",
    "instagram_url",
    "tiktok_url",
    "facebook_url",
    "x_url",
    "og_image_url",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_settings(row: dict[str, Any] | None) -> dict[str, Any]:
    data = row or {}
    return {
        "id": data.get("id"),
        "site_name": data.get("site_name") or "Lombok-Japan Family",
        "site_description": data.get("site_description") or "",
        "logo_url": data.get("logo_url") or None,
        "favicon_url": data.get("favicon_url") or None,
        "contact_email": data.get("contact_email") or None,
        "contact_phone": data.get("contact_phone") or None,
        "contact_address": data.get("contact_address") or None,
        "youtube_channel_url": data.get("youtube_channel_url") or None,
        "instagram_url": data.get("instagram_url") or None,
        "tiktok_url": data.get("tiktok_url") or None,
        "facebook_url": data.get("facebook_url") or None,
        "x_url": data.get("x_url") or None,
        "seo_title": data.get("seo_title") or None,
        "seo_description": data.get("seo_description") or None,
        "seo_keywords": data.get("seo_keywords") or None,
        "og_image_url": data.get("og_image_url") or None,
        "ga4_measurement_id": data.get("ga4_measurement_id") or None,
        "google_tag_manager_id": data.get("google_tag_manager_id") or None,
        "maintenance_mode": bool(data.get("maintenance_mode") or False),
        "created_at": data.get("created_at"),
        "updated_at": data.get("updated_at"),
    }


def _ensure_settings_row() -> dict[str, Any]:
    client = get_supabase_client()
    rows = (
        client.table("settings").select("*").order("created_at", desc=False).limit(1).execute().data
        or []
    )
    if rows:
        return rows[0]

    created = (
        client.table("settings")
        .insert(
            {
                "site_name": "Lombok-Japan Family",
                "site_description": "Official YouTube channel website and CMS",
                "youtube_channel_url": "https://www.youtube.com/@lombokjapanfamily",
                "instagram_url": "https://www.instagram.com/tamu.lj",
                "tiktok_url": "https://www.tiktok.com/@lombokjapanfamily",
                "facebook_url": "https://www.facebook.com/tamulombokjapan/",
                "maintenance_mode": False,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        )
        .execute()
        .data
        or []
    )
    if not created:
        raise RuntimeError("settings row could not be created")
    return created[0]


def get_settings() -> dict[str, Any]:
    return _normalize_settings(_ensure_settings_row())


def _clean_url(value: Any) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if not (text.startswith("http://") or text.startswith("https://") or text.startswith("/")):
        raise ValidationError("URLの形式が正しくありません")
    return text


def update_settings(
    payload: dict[str, Any],
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    current = _ensure_settings_row()
    updates: dict[str, Any] = {}

    for key in EDITABLE_FIELDS:
        if key not in payload:
            continue
        value = payload[key]

        if key == "site_name":
            name = str(value or "").strip()
            if not name:
                raise ValidationError("サイト名を入力してください")
            if len(name) > 120:
                raise ValidationError("サイト名は120文字以内で入力してください")
            updates[key] = name
            continue

        if key == "maintenance_mode":
            updates[key] = bool(value)
            continue

        if key in URL_FIELDS:
            updates[key] = _clean_url(value)
            continue

        if key == "contact_email":
            email = str(value or "").strip()
            updates[key] = email or None
            continue

        text = str(value or "").strip()
        updates[key] = text or None

    if not updates:
        raise ValidationError("更新する項目がありません")

    updates["updated_at"] = _now_iso()
    client = get_supabase_client()
    updated = client.table("settings").update(updates).eq("id", current["id"]).execute().data or []
    row = updated[0] if updated else {**current, **updates}

    write_audit_log(
        user_id=actor_id,
        action="SETTINGS_UPDATED",
        target_type="settings",
        target_id=str(row.get("id") or current.get("id")),
        meta={"fields": list(updates.keys())},
    )
    return _normalize_settings(row)


def _upload_and_set(
    *,
    file_storage: Any,
    folder: str,
    field: str,
    actor_id: str | None,
    audit_action: str,
) -> dict[str, Any]:
    file_bytes, filename, content_type = read_settings_asset_file(file_storage)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
    if ext == "jpeg":
        ext = "jpg"
    object_path = f"{folder}/{uuid4().hex}.{ext}"
    uploaded = upload_public_image(
        bucket=SETTINGS_BUCKET,
        object_path=object_path,
        file_bytes=file_bytes,
        content_type=content_type or "application/octet-stream",
        upsert=True,
    )
    result = update_settings({field: uploaded["url"]}, actor_id=actor_id)
    write_audit_log(
        user_id=actor_id,
        action=audit_action,
        target_type="settings",
        target_id=str(result.get("id") or ""),
        meta={"url": uploaded["url"], "path": uploaded["path"]},
    )
    return {
        **result,
        "upload": uploaded,
    }


def upload_logo(file_storage: Any, *, actor_id: str | None) -> dict[str, Any]:
    return _upload_and_set(
        file_storage=file_storage,
        folder="logo",
        field="logo_url",
        actor_id=actor_id,
        audit_action="SETTINGS_LOGO_UPLOADED",
    )


def upload_favicon(file_storage: Any, *, actor_id: str | None) -> dict[str, Any]:
    return _upload_and_set(
        file_storage=file_storage,
        folder="favicon",
        field="favicon_url",
        actor_id=actor_id,
        audit_action="SETTINGS_FAVICON_UPLOADED",
    )


def upload_og_image(file_storage: Any, *, actor_id: str | None) -> dict[str, Any]:
    return _upload_and_set(
        file_storage=file_storage,
        folder="og",
        field="og_image_url",
        actor_id=actor_id,
        audit_action="SETTINGS_OG_UPLOADED",
    )
