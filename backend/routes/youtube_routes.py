from __future__ import annotations

from flask import Blueprint, request

from services import supabase_service, youtube_service
from services.supabase_service import SupabaseConfigError
from services.youtube_service import YouTubeApiError, YouTubeConfigError
from utils.auth import is_staff_request, require_editor
from utils.response import error, success

youtube_bp = Blueprint("youtube", __name__, url_prefix="/api/videos")

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
        return error("動画一覧の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.get("/featured")
def get_featured_videos():
    try:
        videos = supabase_service.list_videos(is_featured=True, is_visible=True)
        return success({"items": videos, "total": len(videos)})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("おすすめ動画の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.get("/home")
def get_home_videos():
    try:
        videos = supabase_service.list_videos(show_on_home=True, is_visible=True)
        return success({"items": videos, "total": len(videos)})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("トップページ動画の取得に失敗しました。", status=500, details=str(exc))


@youtube_bp.post("/sync")
def sync_videos():
    _, err = require_editor()
    if err:
        return err

    try:
        youtube_videos = youtube_service.fetch_channel_videos(max_pages=5)
        if not youtube_videos:
            return success(
                {"synced": 0, "items": []},
                message="取得できる動画がありませんでした。",
            )

        # Preserve CMS fields by upserting only YouTube-sourced columns.
        rows = []
        for item in youtube_videos:
            rows.append(
                {
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
            )

        saved = supabase_service.upsert_videos(rows)
        return success(
            {"synced": len(saved), "items": saved},
            message=f"{len(saved)}件の動画を同期しました。",
        )
    except YouTubeConfigError as exc:
        return error(str(exc), status=400)
    except YouTubeApiError as exc:
        return error(str(exc), status=502)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("YouTube同期に失敗しました。", status=500, details=str(exc))


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
