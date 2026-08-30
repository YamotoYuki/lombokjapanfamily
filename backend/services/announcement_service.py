from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from services.supabase_service import get_supabase_client
from utils.publish_window import is_row_publicly_visible
from utils.validators import ValidationError

URL_RE = re.compile(r"^https?://", re.IGNORECASE)

CATEGORIES = frozenset({"announcement", "video", "event", "update"})

YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
}

# Multilingual body/title fields (+ legacy mirrors).
I18N_TEXT_FIELDS = (
    "title_ja",
    "title_en",
    "title_id",
    "content_ja",
    "content_en",
    "content_id",
)


class AnnouncementNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _optional_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _text_or_empty(value: Any) -> str:
    return str(value or "").strip()


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


def _optional_url(value: Any, label: str, *, allowed_hosts: set[str] | None = None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not URL_RE.match(text):
        raise ValidationError(f"{label}の形式が正しくありません")
    if allowed_hosts is not None:
        host = (urlparse(text).hostname or "").lower()
        if host not in allowed_hosts:
            raise ValidationError(f"{label}の形式が正しくありません")
    return text


def _parse_datetime(value: Any, label: str) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        text = f"{text}T00:00:00+00:00"
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationError(f"{label}の形式が正しくありません") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def _resolve_title_ja(payload: dict[str, Any]) -> str:
    """Prefer title_ja; accept legacy `title` for backward compatibility."""
    if "title_ja" in payload:
        return _text_or_empty(payload.get("title_ja"))
    if "title" in payload:
        return _text_or_empty(payload.get("title"))
    return ""


def _resolve_content_ja(payload: dict[str, Any]) -> str:
    if "content_ja" in payload:
        return str(payload.get("content_ja") or "")
    if "content" in payload:
        return str(payload.get("content") or "")
    return ""


def validate_announcement_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
) -> dict[str, Any]:
    data: dict[str, Any] = {}

    title_keys_present = any(key in payload for key in ("title_ja", "title"))
    if not partial or title_keys_present:
        title_ja = _resolve_title_ja(payload)
        if not title_ja:
            raise ValidationError("タイトル（日本語）を入力してください")
        data["title_ja"] = title_ja
        # Keep legacy columns in sync for older clients / constraints.
        data["title"] = title_ja

    content_keys_present = any(key in payload for key in ("content_ja", "content"))
    if not partial or content_keys_present:
        content_ja = _resolve_content_ja(payload)
        data["content_ja"] = content_ja
        data["content"] = content_ja

    for field in ("title_en", "title_id", "content_en", "content_id"):
        if not partial or field in payload:
            # Empty string → null so "unset" is clear for public fallback.
            if field.startswith("title_"):
                data[field] = _optional_text(payload.get(field))
            else:
                text = str(payload.get(field) or "").strip()
                data[field] = text or None

    if not partial or "category" in payload:
        category = str(payload.get("category") or "announcement").strip().lower()
        if category not in CATEGORIES:
            raise ValidationError("カテゴリが不正です")
        data["category"] = category

    if not partial or "published_at" in payload:
        published_at = _parse_datetime(payload.get("published_at"), "公開日")
        if published_at is None and not partial:
            published_at = _now_iso()
        if published_at is not None or not partial:
            data["published_at"] = published_at or _now_iso()

    if not partial or "featured_image" in payload:
        image = _optional_text(payload.get("featured_image"))
        if image and not URL_RE.match(image):
            raise ValidationError("アイキャッチ画像URLの形式が正しくありません")
        data["featured_image"] = image

    if not partial or "youtube_url" in payload:
        data["youtube_url"] = _optional_url(
            payload.get("youtube_url"),
            "YouTube URL",
            allowed_hosts=YOUTUBE_HOSTS,
        )

    if not partial or "publish_start_at" in payload:
        data["publish_start_at"] = _parse_datetime(
            payload.get("publish_start_at"),
            "公開開始日時",
        )

    if not partial or "publish_end_at" in payload:
        data["publish_end_at"] = _parse_datetime(
            payload.get("publish_end_at"),
            "公開終了日時",
        )

    start = data.get("publish_start_at")
    end = data.get("publish_end_at")
    if start and end:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        if end_dt < start_dt:
            raise ValidationError("公開終了日時は開始日時以降にしてください")

    if not partial or "is_featured" in payload:
        data["is_featured"] = _bool(payload.get("is_featured"), False)

    if not partial or "is_published" in payload:
        data["is_published"] = _bool(payload.get("is_published"), True)

    data["updated_at"] = _now_iso()
    return data


def list_announcements(
    *,
    published_only: bool = False,
    category: str | None = None,
    featured: bool | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    client = get_supabase_client()
    query = client.table("announcements").select("*", count="exact")
    if published_only:
        query = query.eq("is_published", True)
    if category:
        query = query.eq("category", category)
    if featured is not None:
        query = query.eq("is_featured", featured)

    start = max(page - 1, 0) * limit
    if published_only:
        # Fetch published rows then apply schedule window in-process.
        result = (
            query.order("published_at", desc=True)
            .order("created_at", desc=True)
            .execute()
        )
        items = [
            row
            for row in (result.data or [])
            if is_row_publicly_visible(row)
        ]
        total = len(items)
        return {
            "items": items[start : start + limit],
            "total": total,
            "page": page,
            "limit": limit,
        }

    end = start + limit - 1
    result = (
        query.order("published_at", desc=True)
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )
    items = result.data or []
    total = int(result.count or len(items))
    return {"items": items, "total": total, "page": page, "limit": limit}


def get_announcement(announcement_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    row = (
        client.table("announcements")
        .select("*")
        .eq("id", announcement_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise AnnouncementNotFoundError("お知らせが見つかりません")
    return row


def is_announcement_public(row: dict[str, Any]) -> bool:
    return is_row_publicly_visible(row, active_key="is_published")


def create_announcement(payload: dict[str, Any]) -> dict[str, Any]:
    data = validate_announcement_payload(payload, partial=False)
    data["created_at"] = _now_iso()
    client = get_supabase_client()
    result = client.table("announcements").insert(data).execute()
    item = (result.data or [None])[0]
    if not item:
        raise ValidationError("お知らせの保存に失敗しました")
    return item


def update_announcement(announcement_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    get_announcement(announcement_id)
    data = validate_announcement_payload(payload, partial=True)
    client = get_supabase_client()
    result = (
        client.table("announcements")
        .update(data)
        .eq("id", announcement_id)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise AnnouncementNotFoundError("お知らせが見つかりません")
    return rows[0]


def soft_delete_announcement(announcement_id: str) -> dict[str, Any]:
    return update_announcement(announcement_id, {"is_published": False})


def delete_announcement(announcement_id: str) -> dict[str, Any]:
    item = get_announcement(announcement_id)
    client = get_supabase_client()
    client.table("announcements").delete().eq("id", announcement_id).execute()
    return item


def get_announcement_stats() -> dict[str, int]:
    client = get_supabase_client()
    rows = (
        client.table("announcements")
        .select("id, is_published, is_featured")
        .execute()
        .data
        or []
    )
    total = len(rows)
    published = sum(1 for row in rows if row.get("is_published"))
    featured = sum(1 for row in rows if row.get("is_featured") and row.get("is_published"))
    return {
        "total": total,
        "published_count": published,
        "featured_count": featured,
    }
