"""Shared publish-window helpers for announcements and notification banners."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def parse_ts(value: Any) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_within_publish_window(
    *,
    publish_start_at: Any = None,
    publish_end_at: Any = None,
    now: datetime | None = None,
) -> bool:
    """
    Unset bounds keep previous visibility rules (caller still checks is_published/is_active).

    - If start is set: visible only when now >= start
    - If end is set: hidden when now > end (visible when now <= end)
    """
    current = now or datetime.now(timezone.utc)
    start = parse_ts(publish_start_at)
    end = parse_ts(publish_end_at)
    if start is not None and current < start:
        return False
    if end is not None and current > end:
        return False
    return True


def is_row_publicly_visible(
    row: dict[str, Any],
    *,
    active_key: str = "is_published",
    now: datetime | None = None,
) -> bool:
    if not row.get(active_key, True):
        return False
    return is_within_publish_window(
        publish_start_at=row.get("publish_start_at"),
        publish_end_at=row.get("publish_end_at"),
        now=now,
    )
