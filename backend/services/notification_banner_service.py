from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from services.supabase_service import get_supabase_client
from utils.publish_window import is_row_publicly_visible
from utils.validators import ValidationError

URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class NotificationBannerNotFoundError(LookupError):
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


def _optional_url(value: Any, label: str) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    # Allow relative site paths as well as absolute URLs.
    if text.startswith("/") and not text.startswith("//"):
        return text
    if not URL_RE.match(text):
        raise ValidationError(f"{label}の形式が正しくありません")
    parsed = urlparse(text)
    if parsed.scheme not in {"http", "https"}:
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


def validate_banner_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
) -> dict[str, Any]:
    data: dict[str, Any] = {}

    if not partial or "title_ja" in payload:
        title_ja = _text_or_empty(payload.get("title_ja"))
        if not title_ja:
            raise ValidationError("タイトル（日本語）を入力してください")
        data["title_ja"] = title_ja

    if not partial or "message_ja" in payload:
        data["message_ja"] = str(payload.get("message_ja") or "")

    for field in ("title_en", "title_id", "message_en", "message_id"):
        if not partial or field in payload:
            data[field] = _optional_text(payload.get(field))

    if not partial or "link_url" in payload:
        data["link_url"] = _optional_url(payload.get("link_url"), "リンクURL")

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

    if not partial or "is_active" in payload:
        data["is_active"] = _bool(payload.get("is_active"), True)

    data["updated_at"] = _now_iso()
    return data


def list_banners(*, active_only: bool = False) -> list[dict[str, Any]]:
    client = get_supabase_client()
    query = client.table("notification_banners").select("*")
    if active_only:
        query = query.eq("is_active", True)
    result = (
        query.order("updated_at", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    items = result.data or []
    if active_only:
        items = [
            row
            for row in items
            if is_row_publicly_visible(row, active_key="is_active")
        ]
    return items


def get_active_banner() -> dict[str, Any] | None:
    items = list_banners(active_only=True)
    return items[0] if items else None


def get_banner(banner_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    row = (
        client.table("notification_banners")
        .select("*")
        .eq("id", banner_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise NotificationBannerNotFoundError("通知バナーが見つかりません")
    return row


def create_banner(payload: dict[str, Any]) -> dict[str, Any]:
    data = validate_banner_payload(payload, partial=False)
    data["created_at"] = _now_iso()
    client = get_supabase_client()
    result = client.table("notification_banners").insert(data).execute()
    item = (result.data or [None])[0]
    if not item:
        raise ValidationError("通知バナーの保存に失敗しました")
    return item


def update_banner(banner_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    get_banner(banner_id)
    data = validate_banner_payload(payload, partial=True)
    client = get_supabase_client()
    result = (
        client.table("notification_banners")
        .update(data)
        .eq("id", banner_id)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise NotificationBannerNotFoundError("通知バナーが見つかりません")
    return rows[0]


def delete_banner(banner_id: str) -> dict[str, Any]:
    item = get_banner(banner_id)
    client = get_supabase_client()
    client.table("notification_banners").delete().eq("id", banner_id).execute()
    return item
