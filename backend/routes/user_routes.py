from __future__ import annotations

from flask import Blueprint, request

from services import user_service
from services.user_service import UserNotFoundError
from utils.auth import require_admin, require_staff
from utils.response import error, success
from utils.validators import ValidationError

users_bp = Blueprint("users", __name__)


@users_bp.get("/api/users/stats")
def users_stats():
    actor, err = require_admin()
    if err:
        return err
    try:
        return success(user_service.get_user_stats())
    except Exception as exc:
        return error("ユーザーの取得に失敗しました", status=500, details=str(exc))


@users_bp.get("/api/users/me")
def users_me():
    actor, err = require_staff()
    if err:
        return err
    try:
        assert actor is not None
        user_service.touch_last_login(actor.id)
        return success(user_service.get_user(actor.id))
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザーの取得に失敗しました", status=500, details=str(exc))


@users_bp.get("/api/users")
def list_users():
    actor, err = require_admin()
    if err:
        return err
    try:
        data = user_service.list_users(
            keyword=request.args.get("keyword"),
            role=request.args.get("role"),
            status=request.args.get("status"),
            page=int(request.args.get("page") or 1),
            limit=int(request.args.get("limit") or 50),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("ユーザーの取得に失敗しました", status=500, details=str(exc))


@users_bp.get("/api/users/<user_id>")
def get_user(user_id: str):
    actor, err = require_admin()
    if err:
        return err
    try:
        return success(user_service.get_user(user_id))
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザーの取得に失敗しました", status=500, details=str(exc))


@users_bp.patch("/api/users/<user_id>")
def patch_user(user_id: str):
    actor, err = require_admin()
    if err:
        return err
    try:
        assert actor is not None
        payload = request.get_json(silent=True) or {}
        user = user_service.update_profile(
            user_id,
            payload,
            actor_id=actor.id,
        )
        return success(user, message="ユーザーを更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザー更新に失敗しました", status=500, details=str(exc))


@users_bp.patch("/api/users/<user_id>/role")
def patch_user_role(user_id: str):
    actor, err = require_admin()
    if err:
        return err
    try:
        assert actor is not None
        payload = request.get_json(silent=True) or {}
        role = payload.get("role")
        user = user_service.update_role(user_id, str(role or ""), actor_id=actor.id)
        return success(user, message="ユーザーを更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザー更新に失敗しました", status=500, details=str(exc))


@users_bp.patch("/api/users/<user_id>/status")
def patch_user_status(user_id: str):
    actor, err = require_admin()
    if err:
        return err
    try:
        assert actor is not None
        payload = request.get_json(silent=True) or {}
        status = payload.get("status")
        user = user_service.update_status(
            user_id,
            str(status or ""),
            actor_id=actor.id,
        )
        return success(user, message="ユーザーを更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザー更新に失敗しました", status=500, details=str(exc))


@users_bp.delete("/api/users/<user_id>")
def delete_user(user_id: str):
    actor, err = require_admin()
    if err:
        return err
    try:
        assert actor is not None
        if actor.id == user_id:
            return error("自分自身は削除できません", status=400)
        user = user_service.soft_delete_user(user_id, actor_id=actor.id)
        return success(user, message="ユーザーを更新しました")
    except UserNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ユーザー更新に失敗しました", status=500, details=str(exc))
