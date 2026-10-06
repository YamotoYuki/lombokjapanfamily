from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from gotrue.errors import AuthApiError
from gotrue.errors import AuthError as GoTrueAuthError

from services.audit_service import write_audit_log
from services.supabase_service import create_scoped_client, get_supabase_client
from utils.auth import (
    CODE_ACCOUNT_SUSPENDED,
    MSG_ACCOUNT_SUSPENDED,
    AuthError,
    assert_account_usable,
    load_account_state,
)

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


class AccountBlockedError(RuntimeError):
    """Correct password, but the account may not use the CMS (suspended,
    deleted, banned in Auth, or no role). Never counts as a failed attempt."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


class AuthUnavailableError(RuntimeError):
    """Account state could not be checked (Supabase outage) — retryable."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


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


def _is_banned_error(exc: Exception) -> bool:
    return isinstance(exc, AuthApiError) and (
        getattr(exc, "code", None) == "user_banned" or "banned" in str(exc).lower()
    )


def _verify_password(email: str, password: str) -> dict[str, Any]:
    """Verify credentials against Supabase Auth using a throwaway client.

    See supabase_service.create_scoped_client() for why this must never be
    the shared get_supabase_client() singleton.
    """
    temp_client = create_scoped_client()
    try:
        result = temp_client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except AuthApiError as exc:
        # A user suspended via the CMS is banned in Supabase Auth; report
        # that as what it is instead of "wrong password" (and don't let it
        # feed the failed-attempt lock).
        if _is_banned_error(exc):
            raise AccountBlockedError(MSG_ACCOUNT_SUSPENDED, CODE_ACCOUNT_SUSPENDED) from None
        raise
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


def _check_account(user_id: str) -> None:
    """Same usability rule as every authenticated API (utils.auth), applied
    before a session is handed out. Raises AccountBlockedError (403) or
    AuthUnavailableError (503)."""
    try:
        profile, role = load_account_state(get_supabase_client(), user_id)
        assert_account_usable(profile, role)
    except AuthError as exc:
        if exc.status == 503:
            raise AuthUnavailableError(exc.message, exc.code) from None
        raise AccountBlockedError(exc.message, exc.code) from None


def _revoke_session(access_token: str) -> None:
    """Best effort: revoke the session sign_in_with_password just created for
    a blocked account, so its refresh token can't be reused."""
    try:
        create_scoped_client().auth.admin.sign_out(access_token)
    except Exception as exc:
        logger.info("could not revoke blocked login session: %s", exc)


def _touch_last_login(user_id: str) -> None:
    """Record the login server-side (service role). The browser no longer
    writes profiles itself — authenticated has no UPDATE on profiles once
    the 20261006 migration is applied. Never fails the login."""
    try:
        get_supabase_client().table("profiles").update(
            {"last_login_at": _now().isoformat()}
        ).eq("id", user_id).execute()
    except Exception as exc:
        logger.warning("last_login_at update failed for %s: %s", user_id, exc)


def sign_in(email: str, password: str) -> dict[str, Any]:
    """Password sign-in gated by a server-side, per-email failed-attempt lock.

    Order (per spec):
    1. check lock
    2. if locked, short-circuit without touching Supabase Auth
    3. otherwise, verify against Supabase Auth
    4. on failure, +1 (never PII/password/token in logs)
    5. 5th consecutive failure -> locked_until = now + 1h
    6. on success, check the account is usable (status / deleted / role) —
       only after the password is proven, so account state never leaks to
       someone who doesn't know the password
    7. reset the counter, record last_login_at
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
    except AccountBlockedError as exc:
        # Banned in Supabase Auth (suspended/deleted via the CMS).
        write_audit_log(
            user_id=None,
            action="ADMIN_LOGIN_BLOCKED",
            target_type="login_lockout",
            target_id=None,
            meta={"reason": exc.code},
        )
        raise
    except (InvalidCredentialsError, GoTrueAuthError):
        # May itself raise LoginLockedError on the 5th consecutive failure —
        # that propagates as-is instead of the InvalidCredentialsError below.
        _record_failed_attempt(client, normalized_email, lockout)
        raise InvalidCredentialsError() from None

    user_id = session["user"]["id"]
    try:
        _check_account(user_id)
    except AccountBlockedError as exc:
        _revoke_session(session["access_token"])
        write_audit_log(
            user_id=user_id,
            action="ADMIN_LOGIN_BLOCKED",
            target_type="user",
            target_id=user_id,
            meta={"reason": exc.code},
        )
        raise
    except AuthUnavailableError:
        _revoke_session(session["access_token"])
        raise

    _touch_last_login(user_id)

    if lockout:
        _clear_lockout(client, normalized_email)

    write_audit_log(
        user_id=session["user"]["id"],
        action="ADMIN_LOGIN_SUCCESS",
        target_type="user",
        target_id=session["user"]["id"],
    )
    return session
