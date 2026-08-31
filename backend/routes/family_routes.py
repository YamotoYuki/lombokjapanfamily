from __future__ import annotations

from flask import Blueprint, request

from services import family_service
from services.family_service import FamilyNotFoundError
from services.storage_service import read_upload_file
from services.supabase_service import SupabaseConfigError
from utils.auth import is_staff_request, require_editor, require_staff
from utils.response import error, success
from utils.validators import ValidationError

family_bp = Blueprint("family", __name__)


def _parse_bool_arg(value: str | None) -> bool | None:
    if value is None or value == "":
        return None
    lowered = value.lower()
    if lowered in {"1", "true", "yes", "on"}:
        return True
    if lowered in {"0", "false", "no", "off"}:
        return False
    return None


@family_bp.get("/api/family")
def list_family():
    try:
        staff = is_staff_request()
        visible_only = str(request.args.get("visible_only") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        show_on_home = _parse_bool_arg(request.args.get("show_on_home"))
        if not staff:
            visible_only = True
        items = family_service.list_family_profiles(
            visible_only=visible_only,
            show_on_home=show_on_home,
        )
        return success({"items": items})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "家族プロフィールの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.get("/api/family/stats")
def family_stats():
    _, err = require_staff()
    if err:
        return err
    try:
        return success(family_service.get_family_stats())
    except Exception as exc:
        return error(
            "家族プロフィールの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.patch("/api/family/reorder")
def reorder_family():
    _, err = require_editor()
    if err:
        return err
    try:
        body = request.get_json(silent=True) or []
        items = body if isinstance(body, list) else body.get("items") or []
        updated = family_service.reorder_family_profiles(items)
        return success(updated, message="表示順を更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "家族プロフィールの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.get("/api/family/<profile_id>")
def get_family(profile_id: str):
    try:
        profile = family_service.get_family_profile(profile_id)
        if not is_staff_request() and not profile.get("is_visible", True):
            raise FamilyNotFoundError("家族プロフィールが見つかりません")
        return success(profile)
    except FamilyNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "家族プロフィールの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.post("/api/family")
def create_family():
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        profile = family_service.create_family_profile(payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="FAMILY_CREATED",
                target_type="family_profiles",
                target_id=str(profile.get("id") or ""),
            )
        except Exception:
            pass
        return success(profile, message="家族プロフィールを保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "家族プロフィールの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.patch("/api/family/<profile_id>")
def update_family(profile_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        profile = family_service.update_family_profile(profile_id, payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="FAMILY_UPDATED",
                target_type="family_profiles",
                target_id=profile_id,
            )
        except Exception:
            pass
        return success(profile, message="家族プロフィールを保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except FamilyNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "家族プロフィールの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.delete("/api/family/<profile_id>")
def delete_family(profile_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        hard = str(request.args.get("hard") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if hard:
            profile = family_service.hard_delete_family_profile(profile_id)
            message = "家族プロフィールを削除しました"
            action = "FAMILY_HARD_DELETED"
        else:
            profile = family_service.soft_delete_family_profile(profile_id)
            message = "家族プロフィールを非表示にしました"
            action = "FAMILY_DELETED"
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action=action,
                target_type="family_profiles",
                target_id=profile_id,
            )
        except Exception:
            pass
        return success(profile, message=message)
    except FamilyNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "家族プロフィールの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@family_bp.post("/api/family/<profile_id>/upload-photo")
def upload_family_photo(profile_id: str):
    _, err = require_editor()
    if err:
        return err
    try:
        file_storage = request.files.get("photo") or request.files.get("file")
        file_bytes, filename, content_type = read_upload_file(file_storage)
        uploaded = family_service.upload_family_photo(
            profile_id=profile_id,
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )
        return success(uploaded, message="家族プロフィールを保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except FamilyNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "画像のアップロードに失敗しました",
            status=500,
            details=str(exc),
        )
