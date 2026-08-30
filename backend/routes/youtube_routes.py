from __future__ import annotations

import logging

from flask import Blueprint, request

from services import supabase_service, youtube_service
from services.supabase_service import SupabaseConfigError
from services.youtube_service import YouTubeApiError, YouTubeConfigError
from utils.auth import is_staff_request, require_editor, require_staff
from utils.response import error, success

logger = logging.getLogger(__name__)

youtube_bp = Blueprint("youtube", __name__, url_prefix="/api/videos")
admin_videos_bp = Blueprint("admin_videos", __name__, url_prefix="/api/admin/videos")

ALLOWED_UPDATE_FIELDS = {
    "category",
    "is_featured",
    "is_visible",
    "show_on_home",
    "display_order",
}


def _parse_bool(value: str | None) -> bool | None:
    if value is None or value == "":
        return None
    lowered = value.lower()
    if lowered in {"true", "1", "yes"}:
        return True
    if lowered in {"false", "0", "no"}:
        return False
    return None


def _sync_from_youtube():
    """Shared sync implementation for /api/videos/sync and /api/admin/videos/sync."""
    from services.youtube_stats_store import save_channel_stats

    channel = youtube_service.get_channel_info()
    try:
        save_channel_stats(
            {
                "subscriber_count": channel.get("subscriber_count"),
                "video_count": channel.get("video_count"),
                "total_view_count": channel.get("view_count"),
                "channel_id": channel.get("id"),
                "title": channel.get("title"),
            }
        )
    except Exception as exc:
        logger.warning(
            "Failed to cache channel stats during video sync: %s",
            youtube_service.redact_secrets(str(exc)),
        )

    youtube_videos = youtube_service.fetch_latest_videos(max_pages=5)

    if not youtube_videos:
        return success(
            {
                "synced": 0,
                "items": [],
                "channel": {
                    "id": channel.get("id"),
                    "title": channel.get("title"),
                    "subscriber_count": channel.get("subscriber_count"),
                    "video_count": channel.get("video_count"),
                    "total_view_count": channel.get("view_count"),
                    "view_count": channel.get("view_count"),
                    "thumbnail_url": channel.get("thumbnail_url"),
                },
            },
            message="取得できる動画がありませんでした。",
        )

    # Preserve CMS fields by upserting only YouTube-sourced columns.
    rows = [youtube_service.to_video_upsert_row(item) for item in youtube_videos]
    saved = supabase_service.upsert_videos(rows)

    return success(
        {
            "synced": len(saved),
            "items": saved,
            "channel": {
                "id": channel.get("id"),
                "title": channel.get("title"),
                "subscriber_count": channel.get("subscriber_count"),
                "video_count": channel.get("video_count"),
                "total_view_count": channel.get("view_count"),
                "view_count": channel.get("view_count"),
                "thumbnail_url": channel.get("thumbnail_url"),
            },
        },
        message=f"{len(saved)}件の動画を同期しました。",
    )


@youtube_bp.get("")
def get_videos():
    try:
        q = request.args.get("q")
        category = request.args.get("category")
        is_visible = _parse_bool(request.args.get("is_visible"))
        is_featured = _parse_bool(request.args.get("is_featured"))
        show_on_home = _parse_bool(request.args.get("show_on_home"))

        # Anonymous / public consumers only see visible videos.
        if not is_staff_request():
            is_visible = True

        videos = supabase_service.list_videos(
            q=q,
            category=category,
            is_visible=is_visible,
            is_featured=is_featured,
            show_on_home=show_on_home,
        )
        return success({"items": videos, "total": len(videos)})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        logger.warning("videos list failed: %s", exc)
        return error("動画一覧の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.get("/featured")
def get_featured_videos():
    try:
        videos = supabase_service.list_videos(is_featured=True, is_visible=True)
        return success({"items": videos, "total": len(videos)})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        logger.warning("featured videos failed: %s", exc)
        return error("おすすめ動画の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.get("/home")
def get_home_videos():
    try:
        videos = supabase_service.list_videos(show_on_home=True, is_visible=True)
        # Fallback: when no home flags are set, show latest visible videos.
        if not videos:
            videos = supabase_service.list_videos(is_visible=True)
        videos = videos[:6]
        return success({"items": videos, "total": len(videos)})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        logger.warning("home videos failed: %s", exc)
        return error("トップページ動画の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.get("/channel-stats")
def get_channel_stats():
    """Public channel statistics for TOP page (cached; no API key exposure)."""
    from services.youtube_stats_store import load_channel_stats

    stats = load_channel_stats()
    if not stats:
        return success({"available": False})
    return success({**stats, "available": True})


@youtube_bp.post("/channel-stats/sync")
def sync_channel_stats():
    """Editor-only: refresh channel statistics without full video sync."""
    _, err = require_editor()
    if err:
        return err
    try:
        saved = youtube_service.refresh_channel_stats()
        return success(saved, message="チャンネル統計を更新しました。")
    except YouTubeConfigError as exc:
        return error(str(exc), status=400)
    except YouTubeApiError as exc:
        logger.warning(
            "YouTube channel stats sync API error: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error(youtube_service.redact_secrets(str(exc)), status=502)
    except Exception as exc:
        logger.warning(
            "YouTube channel stats sync failed: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error("チャンネル統計の更新に失敗しました。", status=500)


@youtube_bp.post("/sync")
def sync_videos():
    _, err = require_editor()
    if err:
        return err

    try:
        return _sync_from_youtube()
    except YouTubeConfigError as exc:
        return error(str(exc), status=400)
    except YouTubeApiError as exc:
        logger.warning(
            "YouTube sync API error: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error(youtube_service.redact_secrets(str(exc)), status=502)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        logger.warning(
            "YouTube sync failed: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error("YouTube同期に失敗しました。", status=500)


@admin_videos_bp.post("/sync")
def admin_sync_videos():
    """Spec path: POST /api/admin/videos/sync"""
    _, err = require_editor()
    if err:
        return err

    try:
        return _sync_from_youtube()
    except YouTubeConfigError as exc:
        return error(str(exc), status=400)
    except YouTubeApiError as exc:
        logger.warning(
            "YouTube admin sync API error: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error(youtube_service.redact_secrets(str(exc)), status=502)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        logger.warning(
            "YouTube admin sync failed: %s",
            youtube_service.redact_secrets(str(exc)),
        )
        return error("YouTube同期に失敗しました。", status=500)


@youtube_bp.get("/<video_id>")
def get_video(video_id: str):
    _, err = require_staff()
    if err:
        return err
    try:
        video = supabase_service.get_video(video_id)
        if not video:
            return error("指定された動画が見つかりません。", status=404)
        return success(video)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("動画の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.patch("/<video_id>")
def patch_video(video_id: str):
    _, err = require_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    updates = {key: payload[key] for key in ALLOWED_UPDATE_FIELDS if key in payload}

    if not updates:
        return error("更新する項目がありません。", status=400)

    try:
        updated = supabase_service.update_video(video_id, updates)
        if not updated:
            return error("指定された動画が見つかりません。", status=404)
        return success(updated, message="動画を更新しました。")
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("動画の更新に失敗しました。", status=500, details=str(exc))


@youtube_bp.delete("/<video_id>")
def delete_video(video_id: str):
    _, err = require_editor()
    if err:
        return err

    try:
        updated = supabase_service.soft_delete_video(video_id)
        if not updated:
            return error("指定された動画が見つかりません。", status=404)
        return success(updated, message="動画を非公開にしました。")
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("動画の非公開処理に失敗しました。", status=500, details=str(exc))
