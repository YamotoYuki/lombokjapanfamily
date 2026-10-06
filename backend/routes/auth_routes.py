from __future__ import annotations

from flask import Blueprint, request

from services import auth_service
from services.supabase_service import get_supabase_client
from utils.auth import CODE_AUTH_UNAVAILABLE, MSG_AUTH_UNAVAILABLE, require_staff
from utils.response import error, success

auth_bp = Blueprint("auth", __name__)

# Columns the admin UI needs to render the signed-in user (header, account
# page). Mirrors the frontend Profile type.
_SESSION_PROFILE_COLUMNS = (
    "id,email,display_name,avatar_url,status,last_login_at,"
    "created_at,updated_at,deleted_at"
)


@auth_bp.get("/api/auth/session")
def get_session():
    """Who am I, and may I use the CMS? — the admin UI's single source of
    truth for role/status, replacing its old direct profiles/user_roles reads.

    Uses the same check as every other authenticated API (require_staff →
    resolve_auth_user), so the reason codes line up exactly:
      401 unauthenticated, 403 role_missing / account_suspended /
      account_deleted, 503 auth_unavailable. Read-only: never touches
      last_login_at (that happens once, in POST /api/auth/login).
    """
    actor, err = require_staff()
    if err:
        return err
    assert actor is not None
    try:
        rows = (
            get_supabase_client()
            .table("profiles")
            .select(_SESSION_PROFILE_COLUMNS)
            .eq("id", actor.id)
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        return error(
            MSG_AUTH_UNAVAILABLE,
            status=503,
            details=str(exc),
            code=CODE_AUTH_UNAVAILABLE,
        )
    profile = rows[0] if rows else {"id": actor.id, "email": actor.email}
    return success({"profile": profile, "role": actor.role})


@auth_bp.post("/api/auth/login")
def login():
    """Password sign-in proxy: same Supabase Auth call the frontend used to
    make directly, now gated by a server-side per-email failed-attempt lock
    (see services/auth_service.py). Never logs email/password/tokens."""
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or "")
    password = str(payload.get("password") or "")

    try:
        session = auth_service.sign_in(email, password)
        return success(session)
    except auth_service.LoginLockedError as exc:
        return error(str(exc), status=423)
    except auth_service.InvalidCredentialsError as exc:
        return error(str(exc), status=401)
    except Exception as exc:
        return error(
            "ログインに失敗しました。しばらくしてから再度お試しください。",
            status=500,
            details=str(exc),
        )
