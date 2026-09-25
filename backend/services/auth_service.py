from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from gotrue.errors import AuthError as GoTrueAuthError
from supabase import create_client

from services.audit_service import write_audit_log
from services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(hours=1)

GENERIC_INVALID_MESSAGE = "メールアドレスまたはパスワードが正しくありません。"
LOCKED_OUT_MESSAGE = (
    "ログインに5回失敗したため、セキュリティ保護のため1時間ログインを停止しています。"
)


class InvalidCredentialsError(RuntimeError):
    def __init__(self, message: str = GENERIC_INVALID_MESSAGE):
        super().__init__(message)


class LoginLockedError(RuntimeError):
    def __init__(self, retry_after_seconds: int, *, just_locked: bool = False):
        self.retry_after_seconds = max(retry_after_seconds, 0)
        if just_locked:
            message = LOCKED_OUT_MESSAGE
        else:
            minutes = max(1, round(self.retry_after_seconds / 60))
            message = (
                "セキュリティ保護のためログインを一時停止しています。"
                f"約{minutes}分後に再度お試しください。"
            )
        super().__init__(message)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _get_lockout(client: Any, email: str) -> dict[str, Any] | None:
    rows = (
        client.table("login_lockouts")
        .select("*")
        .eq("email", email)
        .limit(1)
        .execute()
        .data
        or []
    )
    return rows[0] if rows else None


def _clear_lockout(client: Any, email: str) -> None:
    client.table("login_lockouts").update(
        {"failed_attempts": 0, "locked_until": None}
    ).eq("email", email).execute()


def _record_failed_attempt(
    client: Any, email: str, lockout: dict[str, Any] | None
) -> None:
    attempts = (lockout.get("failed_attempts") if lockout else 0) + 1
    just_locked = attempts >= MAX_FAILED_ATTEMPTS
    locked_until = (_now() + LOCKOUT_DURATION).isoformat() if just_locked else None

    payload = {
        "email": email,
        "failed_attempts": attempts,
        "locked_until": locked_until,
    }
    if lockout:
        client.table("login_lockouts").update(payload).eq("email", email).execute()
    else:
        client.table("login_lockouts").insert(payload).execute()

    write_audit_log(
        user_id=None,
        action="ADMIN_LOGIN_LOCKED" if just_locked else "ADMIN_LOGIN_FAILED",
        target_type="login_lockout",
        target_id=None,
        meta={"failed_attempts": attempts},
    )

    if just_locked:
        raise LoginLockedError(int(LOCKOUT_DURATION.total_seconds()), just_locked=True)


def _verify_password(email: str, password: str) -> dict[str, Any]:
    """Verify credentials against Supabase Auth using a throwaway client.

    Deliberately NOT the shared get_supabase_client() singleton: signing in
    mutates a client's internal auth state (supabase-py's SyncClient
    re-points its postgrest Authorization header at the newly-signed-in
    user's own access token whenever a SIGNED_IN event fires — see
    _listen_to_auth_events in the installed supabase package). Since
    get_supabase_client() is a process-wide, @lru_cache'd singleton shared
    by every request, signing in on it would silently swap the service-role
    access every other concurrent request relies on. A fresh, one-off
    client sidesteps that entirely; it's discarded after this call.
    """
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    temp_client = create_client(url, key)
    result = temp_client.auth.sign_in_with_password(
        {"email": email, "password": password}
    )
    if not result.session or not result.user:
        raise InvalidCredentialsError()
    session = result.session
    user = result.user
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in": session.expires_in,
        "expires_at": session.expires_at,
        "token_type": session.token_type,
        "user": {"id": user.id, "email": user.email},
    }


def sign_in(email: str, password: str) -> dict[str, Any]:
    """Password sign-in gated by a server-side, per-email failed-attempt lock.

    Order (per spec):
    1. check lock
    2. if locked, short-circuit without touching Supabase Auth
    3. otherwise, verify against Supabase Auth
    4. on failure, +1 (never PII/password/token in logs)
    5. 5th consecutive failure -> locked_until = now + 1h
    6. on success, reset the counter
    """
    normalized_email = _normalize_email(email)
    if not normalized_email or not password:
        raise InvalidCredentialsError()

    client = get_supabase_client()
    lockout = _get_lockout(client, normalized_email)

    if lockout and lockout.get("locked_until"):
        locked_until = _parse_timestamp(lockout["locked_until"])
        now = _now()
        if locked_until > now:
            retry_after = int((locked_until - now).total_seconds())
            write_audit_log(
                user_id=None,
                action="ADMIN_LOGIN_LOCKED",
                target_type="login_lockout",
                target_id=None,
                meta={"retry_after_seconds": retry_after},
            )
            raise LoginLockedError(retry_after)
        # Lock has naturally expired: start this email fresh rather than
        # carrying the old attempt count forward (avoids re-locking on a
        # single post-expiry mistake).
        _clear_lockout(client, normalized_email)
        lockout = None

    try:
        session = _verify_password(normalized_email, password)
    except (InvalidCredentialsError, GoTrueAuthError):
        # May itself raise LoginLockedError on the 5th consecutive failure —
        # that propagates as-is instead of the InvalidCredentialsError below.
        _record_failed_attempt(client, normalized_email, lockout)
        raise InvalidCredentialsError() from None

    if lockout:
        _clear_lockout(client, normalized_email)

    write_audit_log(
        user_id=session["user"]["id"],
        action="ADMIN_LOGIN_SUCCESS",
        target_type="user",
        target_id=session["user"]["id"],
    )
    return session
