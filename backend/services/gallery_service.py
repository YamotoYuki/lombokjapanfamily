from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from services.storage_service import upload_public_image
from services.supabase_service import get_supabase_client
from utils.validators import ValidationError, validate_image_file

GALLERY_SELECT = "*, category:gallery_categories(*)"
URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class GalleryNotFoundError(LookupError):
    pass


class GalleryConflictError(ValueError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(value: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    if base:
        return base[:80]
    return f"category-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"


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


def _parse_bool_query(value: str | None) -> bool | None:
    if value is None or value == "":
        return None
    return _bool(value, False)


def normalize_gallery_item(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    return row


def validate_gallery_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
    require_image: bool = True,
) -> dict[str, Any]:
    data: dict[str, Any] = {}

    if not partial or "title" in payload:
        data["title"] = _optional_text(payload.get("title"))

    if not partial or "description" in payload:
        data["description"] = _optional_text(payload.get("description"))

    if not partial or "image_url" in payload:
        image_url = _optional_text(payload.get("image_url"))
        if require_image and not partial and not image_url:
            raise ValidationError("画像を選択してください")
        if image_url and not URL_RE.match(image_url):
            raise ValidationError("画像URLの形式が正しくありません")
        if image_url is not None or not partial:
            data["image_url"] = image_url

    if not partial or "thumbnail_url" in payload:
        thumb = _optional_text(payload.get("thumbnail_url"))
        data["thumbnail_url"] = thumb

    if not partial or "category_id" in payload:
        category_id = _optional_text(payload.get("category_id"))
        data["category_id"] = category_id

    if not partial or "location" in payload:
        data["location"] = _optional_text(payload.get("location"))

    if not partial or "taken_at" in payload:
        taken_at = _optional_text(payload.get("taken_at"))
        data["taken_at"] = taken_at

    if not partial or "display_order" in payload:
        data["display_order"] = _optional_int(
            payload.get("display_order"),
            "表示順",
            default=0,
        )

    if not partial or "is_featured" in payload:
        data["is_featured"] = _bool(payload.get("is_featured"), False)

    if not partial or "is_visible" in payload:
        data["is_visible"] = _bool(payload.get("is_visible"), True)

    data["updated_at"] = _now_iso()
    return data


def list_gallery(
    *,
    keyword: str | None = None,
    category: str | None = None,
    featured: bool | None = None,
    visible_only: bool = False,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    client = get_supabase_client()
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    query = client.table("gallery").select(GALLERY_SELECT, count="exact")

    if visible_only:
        query = query.eq("is_visible", True)
    if featured is not None:
        query = query.eq("is_featured", featured)
    if category:
        # Accept category id or slug
        categories = (
            client.table("gallery_categories")
            .select("id")
            .or_(f"id.eq.{category},slug.eq.{category}")
            .execute()
            .data
            or []
        )
        if categories:
            query = query.eq("category_id", categories[0]["id"])
        else:
            query = query.eq("category_id", category)
    if keyword:
        query = query.or_(
            f"title.ilike.%{keyword}%,description.ilike.%{keyword}%,location.ilike.%{keyword}%"
        )

    result = (
        query.order("display_order", desc=False)
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )
    items = [normalize_gallery_item(row) for row in (result.data or [])]
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": result.count or len(items),
    }


def get_gallery_item(item_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    row = (
        client.table("gallery")
        .select(GALLERY_SELECT)
        .eq("id", item_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise GalleryNotFoundError("写真が見つかりません")
    return normalize_gallery_item(row)  # type: ignore[return-value]


def create_gallery_item(payload: dict[str, Any]) -> dict[str, Any]:
    data = validate_gallery_payload(payload, partial=False, require_image=True)
    data["created_at"] = _now_iso()
    if not data.get("thumbnail_url"):
        data["thumbnail_url"] = data.get("image_url")
    client = get_supabase_client()
    result = client.table("gallery").insert(data).execute()
    created = (result.data or [None])[0]
    if not created:
        raise ValidationError("写真の保存に失敗しました")
    return get_gallery_item(created["id"])


def update_gallery_item(item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    get_gallery_item(item_id)
    data = validate_gallery_payload(payload, partial=True, require_image=False)
    # Never wipe image_url via partial empty unless explicitly provided as null intent
    if "image_url" in data and not data["image_url"]:
        data.pop("image_url")
    client = get_supabase_client()
    result = client.table("gallery").update(data).eq("id", item_id).execute()
    if not result.data:
        raise GalleryNotFoundError("写真が見つかりません")
    return get_gallery_item(item_id)


def soft_delete_gallery_item(item_id: str) -> dict[str, Any]:
    return update_gallery_item(item_id, {"is_visible": False})


def upload_gallery_image(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    category_slug: str | None = None,
) -> dict[str, str]:
    extension = validate_image_file(filename, content_type, len(file_bytes))
    folder = (category_slug or "uncategorized").strip() or "uncategorized"
    folder = re.sub(r"[^a-zA-Z0-9_-]+", "-", folder).strip("-") or "uncategorized"
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    object_path = f"{folder}/{stamp}_{uuid.uuid4().hex[:10]}.{extension}"
    return upload_public_image(
        bucket="gallery",
        object_path=object_path,
        file_bytes=file_bytes,
        content_type=content_type or f"image/{extension}",
    )


def list_gallery_categories() -> list[dict[str, Any]]:
    client = get_supabase_client()
    result = (
        client.table("gallery_categories")
        .select("*")
        .order("display_order", desc=False)
        .order("name", desc=False)
        .execute()
    )
    return result.data or []


def create_gallery_category(payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValidationError("カテゴリー名を入力してください")
    slug = str(payload.get("slug") or "").strip() or _slugify(name)
    description = _optional_text(payload.get("description"))
    display_order = _optional_int(payload.get("display_order"), "表示順", default=0)

    client = get_supabase_client()
    existing = (
        client.table("gallery_categories")
        .select("id")
        .eq("slug", slug)
        .maybe_single()
        .execute()
        .data
    )
    if existing:
        raise GalleryConflictError("スラッグが重複しています")

    result = (
        client.table("gallery_categories")
        .insert(
            {
                "name": name,
                "slug": slug,
                "description": description,
                "display_order": display_order,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        )
        .execute()
    )
    return (result.data or [None])[0]


def update_gallery_category(category_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    client = get_supabase_client()
    existing = (
        client.table("gallery_categories")
        .select("*")
        .eq("id", category_id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise GalleryNotFoundError("カテゴリーが見つかりません")

    data: dict[str, Any] = {"updated_at": _now_iso()}
    if "name" in payload:
        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValidationError("カテゴリー名を入力してください")
        data["name"] = name
    if "slug" in payload:
        slug = str(payload.get("slug") or "").strip()
        if not slug:
            raise ValidationError("スラッグを入力してください")
        conflict = (
            client.table("gallery_categories")
            .select("id")
            .eq("slug", slug)
            .neq("id", category_id)
            .maybe_single()
            .execute()
            .data
        )
        if conflict:
            raise GalleryConflictError("スラッグが重複しています")
        data["slug"] = slug
    if "description" in payload:
        data["description"] = _optional_text(payload.get("description"))
    if "display_order" in payload:
        data["display_order"] = _optional_int(
            payload.get("display_order"),
            "表示順",
            default=0,
        )

    result = client.table("gallery_categories").update(data).eq("id", category_id).execute()
    if not result.data:
        raise GalleryNotFoundError("カテゴリーが見つかりません")
    return result.data[0]


def delete_gallery_category(category_id: str) -> None:
    client = get_supabase_client()
    existing = (
        client.table("gallery_categories")
        .select("id")
        .eq("id", category_id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise GalleryNotFoundError("カテゴリーが見つかりません")

    used = (
        client.table("gallery")
        .select("id", count="exact")
        .eq("category_id", category_id)
        .limit(1)
        .execute()
    )
    if (used.count or 0) > 0 or (used.data or []):
        raise GalleryConflictError("このカテゴリーを使用している写真があるため削除できません")

    client.table("gallery_categories").delete().eq("id", category_id).execute()


def get_gallery_stats() -> dict[str, Any]:
    client = get_supabase_client()
    rows = (
        client.table("gallery")
        .select("id,is_visible,is_featured,created_at,title,image_url,thumbnail_url")
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )
    total = len(rows)
    visible = sum(1 for row in rows if row.get("is_visible"))
    featured = sum(1 for row in rows if row.get("is_featured") and row.get("is_visible"))
    recent = rows[:6]
    return {
        "total": total,
        "visible_count": visible,
        "featured_count": featured,
        "recent": recent,
    }


def parse_featured_query(value: str | None) -> bool | None:
    return _parse_bool_query(value)
