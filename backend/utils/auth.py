from __future__ import annotations

import logging
import os
from collections.abc import Callable
from dataclasses import dataclass
from functools import wraps
from typing import Any

import jwt
from flask import request

from services.supabase_service import get_supabase_client
from utils.response import error

logger = logging.getLogger(__name__)

ALLOWED_ROLES = {"admin", "editor", "viewer"}
ALLOWED_STATUSES = {"active", "inactive", "suspended"}


@dataclass
class AuthUser:
    id: str
    email: str | None
    role: str
    status: str


class AuthError(Exception):
    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.message = message
        self.status = status


def _bearer_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        token = header[7:].strip()
        return token or None
    return None


def _user_from_supabase_auth(token: str) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise AuthError("ログインしてください", 401)
        return {"sub": user.id, "email": user.email}
    except AuthError:
        raise
    except Exception as exc:
        logger.warning("Supabase get_user failed: %s", exc)
        raise AuthError("ログインしてください", 401) from exc


def _decode_supabase_jwt(token: str) -> dict[str, Any]:
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip() or os.getenv("JWT_SECRET", "").strip()
    if not secret:
        return _user_from_supabase_auth(token)

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        # Wrong Dashboard JWT Secret / new signing keys → fall back to Auth API.
        logger.warning(
            "JWT local verify failed (%s); falling back to Supabase Auth get_user",
            exc,
        )
        return _user_from_supabase_auth(token)


def resolve_auth_user() -> AuthUser:
    token = _bearer_token()
    if not token:
        raise AuthError("ログインしてください", 401)

    payload = _decode_supabase_jwt(token)
    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        raise AuthError("ログインしてください", 401)

    client = get_supabase_client()
    try:
        profile_rows = (
            client.table("profiles")
            .select("id,email,status,deleted_at")
            .eq("id", user_id)
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        logger.warning("profile lookup failed for %s: %s", user_id, exc)
        raise AuthError("ログインしてください", 401) from exc

    profile = profile_rows[0] if profile_rows else None
    if not profile or profile.get("deleted_at"):
        raise AuthError("アクセス権限がありません", 403)

    status = profile.get("status") or "active"
    if status != "active":
        raise AuthError("アクセス権限がありません", 403)

    try:
        role_rows = (
            client.table("user_roles")
            .select("role")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        logger.warning("role lookup failed for %s: %s", user_id, exc)
        role_rows = []

    role = (role_rows[0] if role_rows else {}).get("role") or "viewer"
    if role not in ALLOWED_ROLES:
        role = "viewer"

    return AuthUser(
        id=user_id,
        email=profile.get("email") or payload.get("email"),
        role=role,
        status=status,
    )


def try_resolve_auth_user() -> AuthUser | None:
    """Return authenticated user or None (never raises)."""
    try:
        return resolve_auth_user()
    except AuthError:
        return None


def is_staff_request() -> bool:
    user = try_resolve_auth_user()
    return bool(user and user.role in ALLOWED_ROLES)


def require_roles(*roles: str) -> tuple[AuthUser | None, Any]:
    try:
        user = resolve_auth_user()
    except AuthError as exc:
        return None, error(exc.message, status=exc.status)

    if roles and user.role not in roles:
        return None, error("権限がありません", status=403)
    return user, None


def require_admin() -> tuple[AuthUser | None, Any]:
    return require_roles("admin")


def require_editor() -> tuple[AuthUser | None, Any]:
    """Editor or Admin."""
    return require_roles("admin", "editor")


def require_staff() -> tuple[AuthUser | None, Any]:
    """Any authenticated CMS role."""
    return require_roles("admin", "editor", "viewer")


def roles_required(*roles: str) -> Callable:
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user, err = require_roles(*roles)
            if err:
                return err
            request.auth_user = user  # type: ignore[attr-defined]
            return fn(*args, **kwargs)

        return wrapper

    return decorator
