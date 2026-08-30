"""Persist YouTube channel statistics without DB migrations.

Stored under backend/data/youtube_channel_stats.json (gitignored).
Updated by full video sync and by the lightweight daily stats refresh.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
STATS_PATH = DATA_DIR / "youtube_channel_stats.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_channel_stats() -> dict[str, Any] | None:
    try:
        if not STATS_PATH.exists():
            return None
        raw = json.loads(STATS_PATH.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return None
        return {
            "subscriber_count": int(raw.get("subscriber_count") or 0),
            "video_count": int(raw.get("video_count") or 0),
            "total_view_count": int(
                raw.get("total_view_count")
                or raw.get("view_count")
                or 0
            ),
            "synced_at": raw.get("synced_at"),
            "channel_id": raw.get("channel_id"),
            "title": raw.get("title"),
        }
    except Exception as exc:
        logger.warning("Failed to read YouTube channel stats cache: %s", exc)
        return None


def save_channel_stats(payload: dict[str, Any]) -> dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "subscriber_count": int(payload.get("subscriber_count") or 0),
        "video_count": int(payload.get("video_count") or 0),
        "total_view_count": int(
            payload.get("total_view_count")
            or payload.get("view_count")
            or 0
        ),
        "synced_at": payload.get("synced_at") or _now_iso(),
        "channel_id": payload.get("channel_id") or payload.get("id"),
        "title": payload.get("title"),
    }
    STATS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return data


def is_stats_stale(stats: dict[str, Any] | None, *, max_age_hours: int = 24) -> bool:
    if not stats or not stats.get("synced_at"):
        return True
    try:
        synced = datetime.fromisoformat(str(stats["synced_at"]).replace("Z", "+00:00"))
        if synced.tzinfo is None:
            synced = synced.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - synced
        return age.total_seconds() >= max_age_hours * 3600
    except Exception:
        return True
