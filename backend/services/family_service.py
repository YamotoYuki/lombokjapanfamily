from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from services.supabase_service import get_supabase_client
from utils.validators import ValidationError, validate_image_file

URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class FamilyNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _optional_url(value: Any, label: str) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if not URL_RE.match(text):
        raise ValidationError(f"{label}の形式が正しくありません")
    return text


def _optional_int(value: Any, label: str, default: int | None = 0) -> int | None:
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{label}は数値で入力してください") from exc


def _bool(value: Any, default: bool = True) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return default


def validate_family_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
) -> dict[str, Any]:
    data: dict[str, Any] = {}

    if not partial or "name" in payload:
        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValidationError("名前を入力してください")
        data["name"] = name

    if not partial or "role" in payload:
        role = str(payload.get("role") or "").strip()
        data["role"] = role or None

    if not partial or "description" in payload:
        description = str(payload.get("description") or "").strip()
        data["description"] = description or None

    if not partial or "photo_url" in payload:
        photo_url = str(payload.get("photo_url") or "").strip()
        data["photo_url"] = photo_url or None

    for key, label in (
        ("instagram_url", "Instagram URL"),
        ("tiktok_url", "TikTok URL"),
        ("youtube_url", "YouTube URL"),
        ("x_url", "X URL"),
    ):
        if not partial or key in payload:
            data[key] = _optional_url(payload.get(key), label)

    if not partial or "display_order" in payload:
        data["display_order"] = _optional_int(
            payload.get("display_order"),
            "表示順",
            default=0,
        )

    if not partial or "is_visible" in payload:
        data["is_visible"] = _bool(payload.get("is_visible"), True)

    data["updated_at"] = _now_iso()
    return data


def list_family_profiles(*, visible_only: bool = False) -> list[dict[str, Any]]:
    client = get_supabase_client()
    query = client.table("family_profiles").select("*")
    if visible_only:
        query = query.eq("is_visible", True)
    result = query.order("display_order", desc=False).order("created_at", desc=False).execute()
    return result.data or []


def get_family_profile(profile_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    row = (
        client.table("family_profiles")
        .select("*")
        .eq("id", profile_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise FamilyNotFoundError("家族プロフィールが見つかりません")
    return row


def create_family_profile(payload: dict[str, Any]) -> dict[str, Any]:
    data = validate_family_payload(payload, partial=False)
    data["created_at"] = _now_iso()
    client = get_supabase_client()
    result = client.table("family_profiles").insert(data).execute()
    profile = (result.data or [None])[0]
    if not profile:
        raise ValidationError("家族プロフィールの保存に失敗しました")
    return profile


def update_family_profile(profile_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    get_family_profile(profile_id)
    data = validate_family_payload(payload, partial=True)
    client = get_supabase_client()
    result = client.table("family_profiles").update(data).eq("id", profile_id).execute()
    rows = result.data or []
    if not rows:
        raise FamilyNotFoundError("家族プロフィールが見つかりません")
    return rows[0]


def soft_delete_family_profile(profile_id: str) -> dict[str, Any]:
    return update_family_profile(profile_id, {"is_visible": False})


def reorder_family_profiles(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not isinstance(items, list) or not items:
        raise ValidationError("表示順データが不正です")

    client = get_supabase_client()
    updated: list[dict[str, Any]] = []
    for item in items:
        profile_id = str(item.get("id") or "").strip()
        if not profile_id:
            raise ValidationError("表示順データが不正です")
        order = _optional_int(item.get("display_order"), "表示順", default=0)
        result = (
            client.table("family_profiles")
            .update({"display_order": order, "updated_at": _now_iso()})
            .eq("id", profile_id)
            .execute()
        )
        if result.data:
            updated.append(result.data[0])
    return updated


def upload_family_photo(
    *,
    profile_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict[str, str]:
    from services.storage_service import upload_public_image

    get_family_profile(profile_id)
    extension = validate_image_file(filename, content_type, len(file_bytes))
    object_path = f"family/{profile_id}/profile-{uuid.uuid4().hex}.{extension}"
    uploaded = upload_public_image(
        bucket="avatars",
        object_path=object_path,
        file_bytes=file_bytes,
        content_type=content_type or f"image/{extension}",
    )
    update_family_profile(profile_id, {"photo_url": uploaded["url"]})
    return uploaded


def get_family_stats() -> dict[str, int]:
    client = get_supabase_client()
    all_rows = client.table("family_profiles").select("id,is_visible").execute().data or []
    total = len(all_rows)
    visible = sum(1 for row in all_rows if row.get("is_visible"))
    return {"total": total, "visible_count": visible}
