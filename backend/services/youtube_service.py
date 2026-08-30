from __future__ import annotations

import logging
import os
import re
from typing import Any

import requests

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
DEFAULT_CHANNEL_HANDLE = "lombokjapanfamily"
_API_KEY_IN_TEXT_RE = re.compile(
    r"(?:key=)(AIza[0-9A-Za-z_-]{10,})|(AIza[0-9A-Za-z_-]{20,})",
    re.IGNORECASE,
)


class YouTubeConfigError(RuntimeError):
    pass


class YouTubeApiError(RuntimeError):
    pass


def mask_secret(value: str | None, *, keep: int = 0) -> str:
    """Mask secrets for logs. Default: never echo key material."""
    if not value:
        return "(empty)"
    if keep <= 0:
        return f"*** (len={len(value)})"
    if len(value) <= keep * 2:
        return "***"
    return f"{value[:keep]}...{value[-2:]} (len={len(value)})"


def redact_secrets(text: str) -> str:
    """Strip YouTube API keys from exception / log strings."""
    if not text:
        return text

    def _repl(match: re.Match[str]) -> str:
        raw = match.group(1) or match.group(2) or ""
        if match.group(1):
            return f"key={mask_secret(raw)}"
        return mask_secret(raw)

    return _API_KEY_IN_TEXT_RE.sub(_repl, text)


def _ssl_verify() -> bool:
    # Reuse local SSL workaround flag; keep verification on in production.
    raw = os.getenv("SUPABASE_SSL_VERIFY", "true").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _require_api_key() -> str:
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise YouTubeConfigError("YOUTUBE_API_KEY が設定されていません。")
    return api_key


def has_api_key() -> bool:
    return bool(os.getenv("YOUTUBE_API_KEY", "").strip())


def _get(path: str, params: dict[str, Any]) -> dict[str, Any]:
    api_key = _require_api_key()
    try:
        response = requests.get(
            f"{YOUTUBE_API_BASE}/{path}",
            params={**params, "key": api_key},
            timeout=30,
            verify=_ssl_verify(),
        )
    except requests.RequestException as exc:
        logger.warning("YouTube request failed: %s", redact_secrets(str(exc)))
        raise YouTubeApiError(
            f"YouTube通信に失敗しました: {redact_secrets(str(exc))}"
        ) from None

    if response.status_code != 200:
        try:
            payload = response.json()
            message = payload.get("error", {}).get("message") or response.text
        except Exception:
            message = response.text
        raise YouTubeApiError(
            f"YouTube API取得に失敗しました: {redact_secrets(str(message))}"
        )

    return response.json()


def parse_iso8601_duration(value: str | None) -> str:
    if not value:
        return ""

    match = re.match(
        r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$",
        value,
    )
    if not match:
        return value

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def pick_thumbnail(snippet: dict[str, Any]) -> str | None:
    thumbnails = snippet.get("thumbnails") or {}
    for key in ("maxres", "standard", "high", "medium", "default"):
        item = thumbnails.get(key)
        if item and item.get("url"):
            return item["url"]
    return None


def youtube_watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def resolve_channel_id(explicit_id: str | None = None) -> str:
    """
    Resolve channel ID from env.
    Accepts UC... IDs, or @handle / handle via forHandle.
    Falls back to DEFAULT_CHANNEL_HANDLE when YOUTUBE_CHANNEL_ID is empty.
    """
    configured = (explicit_id or os.getenv("YOUTUBE_CHANNEL_ID", "")).strip()
    candidate = configured or f"@{DEFAULT_CHANNEL_HANDLE}"

    if candidate.startswith("UC") and " " not in candidate:
        return candidate

    handle = candidate if candidate.startswith("@") else f"@{candidate.lstrip('@')}"
    data = _get(
        "channels",
        {
            "part": "id",
            "forHandle": handle,
        },
    )
    items = data.get("items") or []
    if not items:
        raise YouTubeApiError(
            f"YouTubeチャンネルが見つかりません（handle={handle}）。"
            " YOUTUBE_CHANNEL_ID を確認してください。"
        )
    channel_id = items[0].get("id")
    if not channel_id:
        raise YouTubeApiError("チャンネルIDの取得に失敗しました。")
    return channel_id


def get_channel_info(channel_id: str | None = None) -> dict[str, Any]:
    """Fetch channel snippet + statistics (subscribers / video count / thumbnails)."""
    target_id = resolve_channel_id(channel_id)
    data = _get(
        "channels",
        {
            "part": "snippet,statistics,contentDetails",
            "id": target_id,
        },
    )
    items = data.get("items") or []
    if not items:
        raise YouTubeApiError("指定されたYouTubeチャンネルが見つかりません。")

    item = items[0]
    snippet = item.get("snippet") or {}
    statistics = item.get("statistics") or {}
    content_details = item.get("contentDetails") or {}
    uploads = (
        content_details.get("relatedPlaylists", {}).get("uploads")
        if isinstance(content_details.get("relatedPlaylists"), dict)
        else None
    )

    return {
        "id": item.get("id"),
        "title": snippet.get("title"),
        "description": snippet.get("description"),
        "custom_url": snippet.get("customUrl"),
        "thumbnail_url": pick_thumbnail(snippet),
        "subscriber_count": int(statistics.get("subscriberCount") or 0),
        "video_count": int(statistics.get("videoCount") or 0),
        "view_count": int(statistics.get("viewCount") or 0),
        "total_view_count": int(statistics.get("viewCount") or 0),
        "uploads_playlist_id": uploads,
    }


def refresh_channel_stats() -> dict[str, Any]:
    """Fetch channel statistics only and persist to local cache (no video upsert)."""
    from services.youtube_stats_store import save_channel_stats

    info = get_channel_info()
    return save_channel_stats(
        {
            "subscriber_count": info.get("subscriber_count"),
            "video_count": info.get("video_count"),
            "total_view_count": info.get("view_count"),
            "channel_id": info.get("id"),
            "title": info.get("title"),
        }
    )


def maybe_refresh_stale_channel_stats(*, max_age_hours: int = 24) -> dict[str, Any] | None:
    """On server boot: refresh stats only when cache is missing/stale."""
    from services.youtube_stats_store import is_stats_stale, load_channel_stats

    if not has_api_key():
        logger.info("YOUTUBE_API_KEY unset; skip channel stats refresh")
        return None

    cached = load_channel_stats()
    if not is_stats_stale(cached, max_age_hours=max_age_hours):
        logger.info("YouTube channel stats cache is fresh; skip auto refresh")
        return cached

    try:
        saved = refresh_channel_stats()
        logger.info(
            "YouTube channel stats refreshed: subscribers=%s videos=%s views=%s",
            saved.get("subscriber_count"),
            saved.get("video_count"),
            saved.get("total_view_count"),
        )
        return saved
    except Exception as exc:
        logger.warning(
            "YouTube channel stats auto-refresh failed: %s",
            redact_secrets(str(exc)),
        )
        return cached


def get_uploads_playlist_id(channel_id: str | None = None) -> str:
    info = get_channel_info(channel_id)
    uploads = info.get("uploads_playlist_id")
    if not uploads:
        raise YouTubeApiError("チャンネルのアップロード再生リストを取得できませんでした。")
    return str(uploads)


def fetch_playlist_video_ids(playlist_id: str, max_pages: int = 5) -> list[str]:
    video_ids: list[str] = []
    page_token: str | None = None

    for _ in range(max_pages):
        params: dict[str, Any] = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
        }
        if page_token:
            params["pageToken"] = page_token

        data = _get("playlistItems", params)
        for item in data.get("items") or []:
            video_id = item.get("contentDetails", {}).get("videoId")
            if video_id:
                video_ids.append(video_id)

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return video_ids


def fetch_videos_details(video_ids: list[str]) -> list[dict[str, Any]]:
    """Fetch latest video metadata (title, description, thumbnail, published_at, etc.)."""
    if not video_ids:
        return []

    results: list[dict[str, Any]] = []

    for index in range(0, len(video_ids), 50):
        chunk = video_ids[index : index + 50]
        data = _get(
            "videos",
            {
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(chunk),
            },
        )

        for item in data.get("items") or []:
            snippet = item.get("snippet") or {}
            statistics = item.get("statistics") or {}
            content_details = item.get("contentDetails") or {}
            tags = snippet.get("tags") or []
            youtube_id = item.get("id")
            if not youtube_id:
                continue

            results.append(
                {
                    # DB column name
                    "youtube_id": youtube_id,
                    # Spec alias (not persisted)
                    "youtube_video_id": youtube_id,
                    "title": snippet.get("title") or "Untitled",
                    "description": snippet.get("description"),
                    "thumbnail_url": pick_thumbnail(snippet),
                    "channel_title": snippet.get("channelTitle"),
                    "tags": tags,
                    "views": int(statistics.get("viewCount") or 0),
                    "likes": int(statistics.get("likeCount") or 0),
                    "comments": int(statistics.get("commentCount") or 0),
                    "duration": parse_iso8601_duration(content_details.get("duration")),
                    "published_at": snippet.get("publishedAt"),
                    "youtube_url": youtube_watch_url(youtube_id),
                }
            )

    return results


def fetch_latest_videos(max_pages: int = 5) -> list[dict[str, Any]]:
    """Fetch latest uploads for the configured channel."""
    playlist_id = get_uploads_playlist_id()
    video_ids = fetch_playlist_video_ids(playlist_id, max_pages=max_pages)
    return fetch_videos_details(video_ids)


def fetch_channel_videos(max_pages: int = 5) -> list[dict[str, Any]]:
    """Backward-compatible alias used by sync routes."""
    return fetch_latest_videos(max_pages=max_pages)


def to_video_upsert_row(item: dict[str, Any]) -> dict[str, Any]:
    """Map YouTube payload to existing videos table columns (no schema change)."""
    return {
        "youtube_id": item["youtube_id"],
        "title": item["title"],
        "description": item.get("description"),
        "thumbnail_url": item.get("thumbnail_url"),
        "channel_title": item.get("channel_title"),
        "tags": item.get("tags") or [],
        "views": item.get("views") or 0,
        "likes": item.get("likes") or 0,
        "comments": item.get("comments") or 0,
        "duration": item.get("duration"),
        "published_at": item.get("published_at"),
    }
