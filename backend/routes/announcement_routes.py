from __future__ import annotations

from flask import Blueprint, request

from services import announcement_service
from services.announcement_service import AnnouncementNotFoundError
from services.supabase_service import SupabaseConfigError
from utils.auth import is_staff_request, require_editor, require_staff
from utils.response import error, success
from utils.validators import ValidationError, parse_positive_int

announcements_bp = Blueprint("announcements", __name__)


def _parse_bool_arg(value: str | None) -> bool | None:
    if value is None or value == "":
        return None
    lowered = value.lower()
    if lowered in {"1", "true", "yes", "on"}:
        return True
    if lowered in {"0", "false", "no", "off"}:
        return False
    return None


@announcements_bp.get("/api/announcements/stats")
def announcement_stats():
    _, err = require_staff()
    if err:
        return err
    try:
        return success(announcement_service.get_announcement_stats())
    except Exception as exc:
        return error(
            "お知らせの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@announcements_bp.get("/api/announcements")
def list_announcements():
    try:
        staff = is_staff_request()
        published_only = str(request.args.get("published_only") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if not staff:
            published_only = True
        featured = _parse_bool_arg(request.args.get("featured"))
        category = (request.args.get("category") or "").strip() or None
        data = announcement_service.list_announcements(
            published_only=published_only,
            category=category,
            featured=featured,
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"),
                default=20,
                maximum=100,
                label="limit",
            ),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "お知らせの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@announcements_bp.get("/api/announcements/<announcement_id>")
def get_announcement(announcement_id: str):
    try:
        item = announcement_service.get_announcement(announcement_id)
        if not is_staff_request() and not announcement_service.is_announcement_public(
            item
        ):
            raise AnnouncementNotFoundError("お知らせが見つかりません")
        return success(item)
    except AnnouncementNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "お知らせの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@announcements_bp.post("/api/announcements")
def create_announcement():
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = announcement_service.create_announcement(payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="ANNOUNCEMENT_CREATED",
                target_type="announcements",
                target_id=str(item.get("id") or ""),
            )
        except Exception:
            pass
        return success(item, message="お知らせを保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "お知らせの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@announcements_bp.patch("/api/announcements/<announcement_id>")
def update_announcement(announcement_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = announcement_service.update_announcement(announcement_id, payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="ANNOUNCEMENT_UPDATED",
                target_type="announcements",
                target_id=announcement_id,
            )
        except Exception:
            pass
        return success(item, message="お知らせを保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except AnnouncementNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "お知らせの保存に失敗しました",
            status=500,
            details=str(exc),
        )


@announcements_bp.delete("/api/announcements/<announcement_id>")
def delete_announcement(announcement_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        # Soft-unpublish by default; hard delete when ?hard=1
        hard = str(request.args.get("hard") or "").lower() in {"1", "true", "yes"}
        if hard:
            item = announcement_service.delete_announcement(announcement_id)
            message = "お知らせを削除しました"
            action = "ANNOUNCEMENT_DELETED"
        else:
            item = announcement_service.soft_delete_announcement(announcement_id)
            message = "お知らせを非公開にしました"
            action = "ANNOUNCEMENT_UNPUBLISHED"
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action=action,
                target_type="announcements",
                target_id=announcement_id,
            )
        except Exception:
            pass
        return success(item, message=message)
    except AnnouncementNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "お知らせの削除に失敗しました",
            status=500,
            details=str(exc),
        )
