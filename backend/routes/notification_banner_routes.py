from __future__ import annotations

from flask import Blueprint, request

from services import notification_banner_service
from services.notification_banner_service import NotificationBannerNotFoundError
from services.supabase_service import SupabaseConfigError
from utils.auth import is_staff_request, require_editor
from utils.publish_window import is_row_publicly_visible
from utils.response import error, success
from utils.validators import ValidationError

notification_banners_bp = Blueprint("notification_banners", __name__)


@notification_banners_bp.get("/api/notification-banners/active")
def get_active_banner():
    try:
        item = notification_banner_service.get_active_banner()
        # Explicit null so clients can distinguish "no banner" from errors.
        from flask import jsonify

        return jsonify({"ok": True, "data": item}), 200
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "通知バナーの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@notification_banners_bp.get("/api/notification-banners")
def list_banners():
    try:
        staff = is_staff_request()
        active_only = str(request.args.get("active_only") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if not staff:
            active_only = True
        items = notification_banner_service.list_banners(active_only=active_only)
        return success({"items": items})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "通知バナーの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@notification_banners_bp.get("/api/notification-banners/<banner_id>")
def get_banner(banner_id: str):
    try:
        item = notification_banner_service.get_banner(banner_id)
        if not is_staff_request() and not is_row_publicly_visible(
            item, active_key="is_active"
        ):
            raise NotificationBannerNotFoundError("通知バナーが見つかりません")
        return success(item)
    except NotificationBannerNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "通知バナーの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@notification_banners_bp.post("/api/notification-banners")
def create_banner():
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = notification_banner_service.create_banner(payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="NOTIFICATION_BANNER_CREATED",
                target_type="notification_banners",
                target_id=str(item.get("id") or ""),
            )
        except Exception:
            pass
        return success(item, message="通知バナーを保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "通知バナーの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@notification_banners_bp.patch("/api/notification-banners/<banner_id>")
def update_banner(banner_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = notification_banner_service.update_banner(banner_id, payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="NOTIFICATION_BANNER_UPDATED",
                target_type="notification_banners",
                target_id=banner_id,
            )
        except Exception:
            pass
        return success(item, message="通知バナーを保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except NotificationBannerNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "通知バナーの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@notification_banners_bp.delete("/api/notification-banners/<banner_id>")
def delete_banner(banner_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        item = notification_banner_service.delete_banner(banner_id)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="NOTIFICATION_BANNER_DELETED",
                target_type="notification_banners",
                target_id=banner_id,
            )
        except Exception:
            pass
        return success(item, message="通知バナーを削除しました")
    except NotificationBannerNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "通知バナーの削除に失敗しました",
            status=500,
            details=str(exc),
        )
