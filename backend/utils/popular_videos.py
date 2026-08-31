"""Popular video selection helpers (mirrors frontend selectPopularVideos)."""

from __future__ import annotations

from typing import Any


def select_popular_videos(items: list[dict[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    visible = [row for row in items if row.get("is_visible", True)]
    if not visible:
        return []

    featured = [row for row in visible if row.get("is_featured")]
    if featured:
        return sorted(
            featured,
            key=lambda row: (
                -(int(row.get("views") or 0)),
                str(row.get("published_at") or ""),
            ),
            reverse=False,
        )[:limit]

    has_views = any(int(row.get("views") or 0) > 0 for row in visible)
    if has_views:
        return sorted(
            visible,
            key=lambda row: int(row.get("views") or 0),
            reverse=True,
        )[:limit]

    return sorted(
        visible,
        key=lambda row: str(row.get("published_at") or ""),
        reverse=True,
    )[:limit]
