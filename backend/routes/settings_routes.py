from __future__ import annotations

from flask import Blueprint, request

from services import settings_service
from services.supabase_service import SupabaseConfigError
from utils.auth import require_admin
from utils.response import error, success
from utils.validators import ValidationError

settings_bp = Blueprint("settings", __name__)


@settings_bp.get("/api/settings")
def get_settings():
    try:
        return success(settings_service.get_settings())
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("通信エラーが発生しました", status=500, details=str(exc))


@settings_bp.patch("/api/settings")
def patch_settings():
    actor, err = require_admin()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        data = settings_service.update_settings(
            payload,
            actor_id=actor.id if actor else None,
        )
        return success(data, message="設定を保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("設定の保存に失敗しました", status=500, details=str(exc))


@settings_bp.post("/api/settings/upload-logo")
def upload_logo():
    actor, err = require_admin()
    if err:
        return err
    try:
        file_storage = request.files.get("file") or request.files.get("logo")
        data = settings_service.upload_logo(
            file_storage,
            actor_id=actor.id if actor else None,
        )
        return success(data, message="設定を保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("ロゴのアップロードに失敗しました", status=500, details=str(exc))


@settings_bp.post("/api/settings/upload-favicon")
def upload_favicon():
    actor, err = require_admin()
    if err:
        return err
    try:
        file_storage = request.files.get("file") or request.files.get("favicon")
        data = settings_service.upload_favicon(
            file_storage,
            actor_id=actor.id if actor else None,
        )
        return success(data, message="設定を保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "ファビコンのアップロードに失敗しました",
            status=500,
            details=str(exc),
        )


@settings_bp.post("/api/settings/upload-og-image")
def upload_og_image():
    actor, err = require_admin()
    if err:
        return err
    try:
        file_storage = request.files.get("file") or request.files.get("og_image")
        data = settings_service.upload_og_image(
            file_storage,
            actor_id=actor.id if actor else None,
        )
        return success(data, message="設定を保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "OG画像のアップロードに失敗しました",
            status=500,
            details=str(exc),
        )
