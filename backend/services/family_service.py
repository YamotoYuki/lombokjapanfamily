from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from services.supabase_service import get_supabase_client
from utils.validators import ValidationError, validate_image_file

logger = logging.getLogger(__name__)

URL_RE = re.compile(r"^https?://", re.IGNORECASE)

SNS_ALLOWED_HOSTS: dict[str, set[str]] = {
    "youtube_url": {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
    },
    "instagram_url": {"instagram.com", "www.instagram.com"},
    "tiktok_url": {"tiktok.com", "www.tiktok.com", "vm.tiktok.com"},
    "x_url": {"x.com", "www.x.com", "twitter.com", "www.twitter.com"},
}

# Columns present since family_gallery_cms migration (always safe to write).
CORE_COLUMNS = {
    "id",
    "name",
    "photo_url",
    "description",
    "display_order",
    "role",
    "instagram_url",
    "tiktok_url",
    "youtube_url",
    "x_url",
    "is_visible",
    "created_at",
    "updated_at",
}

TEXT_FIELDS = (
    "display_name",
    "nickname",
    "role",
    "description",
    "hometown",
    "current_location",
    "languages",
    "hobbies",
    "favorite_food",
    "favorite_japan",
    "favorite_indonesia",
    "photo_url",
)

SNS_URL_FIELDS = (
    ("instagram_url", "Instagram URL"),
    ("tiktok_url", "TikTok URL"),
    ("youtube_url", "YouTube URL"),
    ("x_url", "X URL"),
)

_family_schema_columns: set[str] | None = None


class FamilyNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _optional_url(value: Any, label: str, *, field: str | None = None) -> str | None:
    # Explicit null / blank clears the column (partial updates included).
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not URL_RE.match(text):
        raise ValidationError(f"{label}の形式が正しくありません")
    if field and field in SNS_ALLOWED_HOSTS:
        from urllib.parse import urlparse

        host = (urlparse(text).hostname or "").lower()
        if host not in SNS_ALLOWED_HOSTS[field]:
            raise ValidationError(f"{label}の形式が正しくありません")
    return text


def _optional_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


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


def _detect_family_columns() -> set[str]:
    """Discover live family_profiles columns without requiring migrations."""
    global _family_schema_columns
    if _family_schema_columns is not None:
        return _family_schema_columns

    client = get_supabase_client()
    rows = (
        client.table("family_profiles").select("*").limit(1).execute().data or []
    )
    if rows:
        _family_schema_columns = set(rows[0].keys())
    else:
        _family_schema_columns = set(CORE_COLUMNS)
    return _family_schema_columns


def _has_column(name: str) -> bool:
    return name in _detect_family_columns()


def _filter_to_schema(data: dict[str, Any]) -> dict[str, Any]:
    allowed = _detect_family_columns()
    filtered = {key: value for key, value in data.items() if key in allowed}
    dropped = sorted(set(data) - set(filtered))
    if dropped:
        logger.info(
            "family_profiles: ignored columns not present in schema: %s",
            ", ".join(dropped),
        )
    return filtered


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

    for key in TEXT_FIELDS:
        if not partial or key in payload:
            data[key] = _optional_text(payload.get(key))

    for key, label in SNS_URL_FIELDS:
        if not partial or key in payload:
            data[key] = _optional_url(payload.get(key), label, field=key)

    if not partial or "display_order" in payload:
        data["display_order"] = _optional_int(
            payload.get("display_order"),
            "表示順",
            default=0,
        )

    if not partial or "is_visible" in payload:
        data["is_visible"] = _bool(payload.get("is_visible"), True)

    if not partial or "show_on_home" in payload:
        data["show_on_home"] = _bool(payload.get("show_on_home"), True)

    if not partial or "translations" in payload:
        translations = payload.get("translations")
        if translations is None:
            data["translations"] = {}
        elif isinstance(translations, dict):
            cleaned: dict[str, Any] = {}
            for lang in ("en", "id"):
                bag = translations.get(lang)
                if not isinstance(bag, dict):
                    continue
                cleaned_bag = {
                    str(key): str(value).strip()
                    for key, value in bag.items()
                    if str(value or "").strip()
                }
                if cleaned_bag:
                    cleaned[lang] = cleaned_bag
            data["translations"] = cleaned
        else:
            raise ValidationError("translations の形式が正しくありません")

    data["updated_at"] = _now_iso()
    return _filter_to_schema(data)


def list_family_profiles(
    *,
    visible_only: bool = False,
    show_on_home: bool | None = None,
) -> list[dict[str, Any]]:
    client = get_supabase_client()
    query = client.table("family_profiles").select("*")
    if visible_only:
        query = query.eq("is_visible", True)
    # Only filter when the live schema supports it (backward compatible).
    if show_on_home is not None and _has_column("show_on_home"):
        query = query.eq("show_on_home", show_on_home)
    result = (
        query.order("display_order", desc=False)
        .order("created_at", desc=False)
        .execute()
    )
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
    if "created_at" in _detect_family_columns():
        data["created_at"] = _now_iso()
    client = get_supabase_client()
    result = client.table("family_profiles").insert(data).execute()
    profile = (result.data or [None])[0]
    if not profile:
        raise ValidationError("家族プロフィールの保存に失敗しました")
    # Refresh schema cache with new row keys.
    global _family_schema_columns
    _family_schema_columns = set(profile.keys())
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


def hard_delete_family_profile(profile_id: str) -> dict[str, Any]:
    item = get_family_profile(profile_id)
    client = get_supabase_client()
    client.table("family_profiles").delete().eq("id", profile_id).execute()
    return item


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
        patch = _filter_to_schema(
            {"display_order": order, "updated_at": _now_iso()}
        )
        result = (
            client.table("family_profiles")
            .update(patch)
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
    select_cols = ["id", "is_visible"]
    if _has_column("show_on_home"):
        select_cols.append("show_on_home")
    all_rows = (
        client.table("family_profiles")
        .select(",".join(select_cols))
        .execute()
        .data
        or []
    )
    total = len(all_rows)
    visible = sum(1 for row in all_rows if row.get("is_visible"))
    on_home = sum(
        1
        for row in all_rows
        if row.get("is_visible") and row.get("show_on_home", True)
    )
    return {"total": total, "visible_count": visible, "home_count": on_home}
