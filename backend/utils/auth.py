from __future__ import annotations

import hashlib
import logging
import os
import threading
import time
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

# Stable reason codes returned alongside 401/403/503 (see utils.response.error).
# The frontend branches on these: account-level 403s sign the user out with
# a reason, AUTH_UNAVAILABLE keeps the session and asks for a reload.
CODE_UNAUTHENTICATED = "unauthenticated"
CODE_ROLE_MISSING = "role_missing"
CODE_ACCOUNT_SUSPENDED = "account_suspended"
CODE_ACCOUNT_DELETED = "account_deleted"
CODE_FORBIDDEN = "forbidden"
CODE_AUTH_UNAVAILABLE = "auth_unavailable"

MSG_LOGIN_REQUIRED = "ログインしてください"
MSG_ROLE_MISSING = "このアカウントには管理画面を利用する権限がありません。"
MSG_ACCOUNT_SUSPENDED = "このアカウントは現在停止されています。"
MSG_ACCOUNT_DELETED = "このアカウントは削除されています。"
MSG_AUTH_UNAVAILABLE = (
    "認証情報を確認できませんでした。通信状況を確認して、もう一度読み込んでください。"
)

# Short TTL cache: home page fires many parallel public APIs with the same Bearer
# token; without caching each call hits Auth API + profiles + roles and can trigger
# Supabase "Server disconnected" under HTTP/2 multiplexing.
_AUTH_CACHE_TTL_SEC = 30.0
_AUTH_CACHE_MAX = 64
_auth_cache_lock = threading.Lock()
_auth_cache: dict[str, tuple[float, AuthUser]] = {}


@dataclass
class AuthUser:
    id: str
    email: str | None
    role: str
    status: str


class AuthError(Exception):
    def __init__(
        self,
        message: str,
        status: int = 401,
        code: str = CODE_UNAUTHENTICATED,
    ):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


def _bearer_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        token = header[7:].strip()
        return token or None
    return None


def _token_cache_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _cache_get(token: str) -> AuthUser | None:
    key = _token_cache_key(token)
    now = time.monotonic()
    with _auth_cache_lock:
        entry = _auth_cache.get(key)
        if not entry:
            return None
        expires_at, user = entry
        if expires_at <= now:
            _auth_cache.pop(key, None)
            return None
        return user


def _cache_set(token: str, user: AuthUser) -> None:
    key = _token_cache_key(token)
    expires_at = time.monotonic() + _AUTH_CACHE_TTL_SEC
    with _auth_cache_lock:
        if len(_auth_cache) >= _AUTH_CACHE_MAX:
            # Drop oldest / expired entries.
            now = time.monotonic()
            stale = [k for k, (exp, _) in _auth_cache.items() if exp <= now]
            for k in stale:
                _auth_cache.pop(k, None)
            while len(_auth_cache) >= _AUTH_CACHE_MAX:
                _auth_cache.pop(next(iter(_auth_cache)))
        _auth_cache[key] = (expires_at, user)


def invalidate_auth_cache(user_id: str) -> None:
    """Drop every cached AuthUser for `user_id`, so a role/status change made
    by an admin takes effect on this worker's very next request instead of
    after the 30s TTL. Other gunicorn workers still hold their own cache, so
    they may lag by up to _AUTH_CACHE_TTL_SEC."""
    with _auth_cache_lock:
        stale = [key for key, (_, user) in _auth_cache.items() if user.id == user_id]
        for key in stale:
            _auth_cache.pop(key, None)


def _user_payload_from_auth_api(token: str) -> dict[str, Any]:
    """Validate access token via Supabase Auth Admin API (works with new signing keys)."""
    from gotrue.errors import AuthApiError

    client = get_supabase_client()
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise AuthError(MSG_LOGIN_REQUIRED, 401)
        return {"sub": user.id, "email": user.email}
    except AuthError:
        raise
    except AuthApiError as exc:
        # Supabase Auth answered and rejected the token (expired/invalid/
        # revoked): a genuine "not logged in".
        logger.info("auth get_user rejected token: %s", exc)
        raise AuthError(MSG_LOGIN_REQUIRED, 401) from exc
    except Exception as exc:
        # Network / Supabase outage: we could not decide either way. Must not
        # be reported as 401, or the client would treat a blip as a logout.
        logger.warning("auth get_user unavailable: %s", exc)
        raise AuthError(MSG_AUTH_UNAVAILABLE, 503, CODE_AUTH_UNAVAILABLE) from exc


def _decode_supabase_jwt(token: str) -> dict[str, Any]:
    secret = (
        os.getenv("SUPABASE_JWT_SECRET", "").strip()
        or os.getenv("JWT_SECRET", "").strip()
    )
    if secret:
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError as exc:
            # Legacy JWT secret mismatch / asymmetric signing keys → Auth API fallback.
            logger.info("local JWT decode failed (%s); falling back to Auth API", exc)

    return _user_payload_from_auth_api(token)


def load_account_state(client: Any, user_id: str) -> tuple[dict[str, Any] | None, str | None]:
    """Fetch (profile, role) for `user_id` straight from profiles/user_roles.

    Raises AuthError(503) when either lookup fails — an outage must never be
    mistaken for "no role" (fail closed, but distinguishably from a 403).
    Returns role=None when the user has no user_roles row.
    """
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
        raise AuthError(MSG_AUTH_UNAVAILABLE, 503, CODE_AUTH_UNAVAILABLE) from exc

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
        raise AuthError(MSG_AUTH_UNAVAILABLE, 503, CODE_AUTH_UNAVAILABLE) from exc

    profile = profile_rows[0] if profile_rows else None
    role = (role_rows[0] if role_rows else {}).get("role")
    return profile, role


def assert_account_usable(profile: dict[str, Any] | None, role: str | None) -> tuple[str, str]:
    """Return (role, status) for a usable CMS account, else raise AuthError(403).

    Single source of truth for "may this account use the CMS at all", shared
    by per-request auth (resolve_auth_user) and the login endpoint. A missing
    or unknown role is denied — it is NOT treated as viewer.
    """
    if not profile:
        raise AuthError(MSG_ROLE_MISSING, 403, CODE_ROLE_MISSING)
    if profile.get("deleted_at"):
        raise AuthError(MSG_ACCOUNT_DELETED, 403, CODE_ACCOUNT_DELETED)
    status = profile.get("status") or "active"
    if status != "active":
        raise AuthError(MSG_ACCOUNT_SUSPENDED, 403, CODE_ACCOUNT_SUSPENDED)
    if role not in ALLOWED_ROLES:
        raise AuthError(MSG_ROLE_MISSING, 403, CODE_ROLE_MISSING)
    return role, status


def resolve_auth_user() -> AuthUser:
    token = _bearer_token()
    if not token:
        logger.info("auth failed: missing Authorization bearer on %s", request.path)
        raise AuthError(MSG_LOGIN_REQUIRED, 401)

    cached = _cache_get(token)
    if cached is not None:
        return cached

    payload = _decode_supabase_jwt(token)
    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        raise AuthError(MSG_LOGIN_REQUIRED, 401)

    client = get_supabase_client()
    profile, raw_role = load_account_state(client, user_id)
    role, status = assert_account_usable(profile, raw_role)
    assert profile is not None

    user = AuthUser(
        id=user_id,
        email=profile.get("email") or payload.get("email"),
        role=role,
        status=status,
    )
    _cache_set(token, user)
    return user


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
        return None, error(exc.message, status=exc.status, code=exc.code)

    if roles and user.role not in roles:
        # Operation-level denial (e.g. editor on an admin-only action): the
        # account itself is fine, so the client must not sign out on this.
        return None, error("権限がありません", status=403, code=CODE_FORBIDDEN)
    return user, None


MSG_HARD_DELETE_ADMIN_ONLY = "完全削除は管理者のみ実行できます。"


def hard_delete_requested() -> bool:
    """True when a DELETE asks for physical deletion (?hard=1/true/yes)."""
    return str(request.args.get("hard") or "").lower() in {"1", "true", "yes"}


def deny_hard_delete_unless_admin(actor: AuthUser | None) -> Any:
    """Gate for ?hard=true deletes on editor-reachable routes.

    The backend uses the service-role key, so the DB's "DELETE is admin-only"
    RLS never applies to these calls — this check is the only enforcement.
    Returns an error response for non-admins, else None.
    """
    if getattr(actor, "role", None) != "admin":
        return error(MSG_HARD_DELETE_ADMIN_ONLY, status=403, code=CODE_FORBIDDEN)
    return None


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
