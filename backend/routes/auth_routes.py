from __future__ import annotations

from flask import Blueprint, request

from services import auth_service
from utils.response import error, success

auth_bp = Blueprint("auth", __name__)


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
