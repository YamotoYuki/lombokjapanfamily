from __future__ import annotations

import os
import re
from typing import Any

import requests

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeConfigError(RuntimeError):
    pass


class YouTubeApiError(RuntimeError):
    pass


def _require_config() -> tuple[str, str]:
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    channel_id = os.getenv("YOUTUBE_CHANNEL_ID", "").strip()

    if not api_key:
        raise YouTubeConfigError("YOUTUBE_API_KEY が設定されていません。")
    if not channel_id:
        raise YouTubeConfigError("YOUTUBE_CHANNEL_ID が設定されていません。")

    return api_key, channel_id


def _get(path: str, params: dict[str, Any]) -> dict[str, Any]:
    api_key, _ = _require_config()
    response = requests.get(
        f"{YOUTUBE_API_BASE}/{path}",
        params={**params, "key": api_key},
        timeout=30,
    )

    if response.status_code != 200:
        try:
            payload = response.json()
            message = payload.get("error", {}).get("message") or response.text
        except Exception:
            message = response.text
        raise YouTubeApiError(f"YouTube API取得に失敗しました: {message}")

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


def get_uploads_playlist_id(channel_id: str | None = None) -> str:
    _, default_channel_id = _require_config()
    target_channel_id = channel_id or default_channel_id

    data = _get(
        "channels",
        {
            "part": "contentDetails",
            "id": target_channel_id,
        },
    )
    items = data.get("items") or []
    if not items:
        raise YouTubeApiError("指定されたYouTubeチャンネルが見つかりません。")

    uploads = items[0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    if not uploads:
        raise YouTubeApiError("チャンネルのアップロード再生リストを取得できませんでした。")
    return uploads


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
    if not video_ids:
        return []

    results: list[dict[str, Any]] = []

    # YouTube videos.list allows up to 50 IDs per request
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

            results.append(
                {
                    "youtube_id": item.get("id"),
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
                }
            )

    return results


def fetch_channel_videos(max_pages: int = 5) -> list[dict[str, Any]]:
    playlist_id = get_uploads_playlist_id()
    video_ids = fetch_playlist_video_ids(playlist_id, max_pages=max_pages)
    return fetch_videos_details(video_ids)
