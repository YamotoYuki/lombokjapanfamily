from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from gotrue.errors import AuthApiError
from gotrue.errors import AuthError as GoTrueAuthError

from services.audit_service import write_audit_log
from services.supabase_service import create_scoped_client, get_supabase_client
from utils.auth import ALLOWED_ROLES, ALLOWED_STATUSES, invalidate_auth_cache
from utils.validators import ValidationError, build_or_filter, sanitize_search_term, validate_email

logger = logging.getLogger(__name__)

MIN_PASSWORD_LENGTH = 8

# Supabase Auth ban_duration values: ~100 years (effectively permanent until
# an admin reactivates) and "none" to lift a ban.
AUTH_BAN_DURATION = "876000h"
AUTH_UNBAN = "none"


class UserNotFoundError(LookupError):
    pass


class UserConflictError(ValueError):
    pass


class AccountSyncError(RuntimeError):
    """Supabase Auth and profiles could not be brought into the same state;
    the change was aborted (and compensated where possible)."""


class SelfModificationError(ValueError):
    """An admin tried to change their own role or status."""


class LastAdminError(RuntimeError):
    """The change would leave no active admin."""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_user(
    profile: dict[str, Any],
    role: str | None,
    *,
    mfa_enabled: bool | None = None,
) -> dict[str, Any]:
    return {
        "id": profile.get("id"),
        "email": profile.get("email") or "",
        "display_name": profile.get("display_name") or "",
        "avatar_url": profile.get("avatar_url"),
        # None = no user_roles row ("未設定"). Never default to viewer: such
        # an account is denied by utils.auth, so showing it as viewer would
        # misrepresent its actual access.
        "role": role if role in ALLOWED_ROLES else None,
        "status": profile.get("status") or "active",
        "mfa_enabled": mfa_enabled,
        "last_login_at": profile.get("last_login_at"),
        "created_at": profile.get("created_at"),
        "updated_at": profile.get("updated_at"),
        "deleted_at": profile.get("deleted_at"),
    }


def _is_duplicate_email_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(
        needle in text
        for needle in ("already been registered", "already exists", "already registered")
    )


def create_user(
    *,
    email: str,
    password: str,
    role: str,
    display_name: str | None = None,
    actor_id: str | None,
) -> dict[str, Any]:
    """Create a new Supabase Auth user + role, for the admin "Add admin" UI.

    Callers must gate this behind require_admin() themselves (see
    routes/user_routes.py) — this function does not check the caller's own
    permissions.

    profiles is populated automatically by the existing
    on_auth_user_created / handle_new_user() DB trigger (see
    supabase/migrations/20260315000000_init.sql) as soon as the Auth user
    is created, so this never inserts into profiles directly. Only
    user_roles needs a separate write; if that write fails, the just
    created Auth user (and its trigger-created profile, via
    ON DELETE CASCADE) is rolled back rather than left as a roleless
    orphan.
    """
    email = validate_email(email)
    if role not in ALLOWED_ROLES:
        raise ValidationError("権限が不正です")
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        raise ValidationError(f"パスワードは{MIN_PASSWORD_LENGTH}文字以上で入力してください")

    # Fresh, throwaway client — see create_scoped_client()'s docstring for
    # why an Auth-admin call must never run on the shared singleton.
    auth_client = create_scoped_client()

    try:
        created = auth_client.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
            }
        )
    except (AuthApiError, GoTrueAuthError) as exc:
        if _is_duplicate_email_error(exc):
            raise UserConflictError(
                "このメールアドレスは既に登録されています"
            ) from None
        raise ValidationError("ユーザー作成に失敗しました") from None

    new_user = created.user if created else None
    if not new_user:
        raise ValidationError("ユーザー作成に失敗しました")
    user_id = new_user.id

    client = get_supabase_client()
    try:
        client.table("user_roles").insert(
            {
                "user_id": user_id,
                "role": role,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        ).execute()
    except Exception:
        try:
            auth_client.auth.admin.delete_user(user_id)
        except Exception:
            logger.exception(
                "Failed to roll back orphaned auth user %s after "
                "user_roles insert failure",
                user_id,
            )
        raise

    if display_name and display_name.strip():
        try:
            update_profile(
                user_id, {"display_name": display_name.strip()}, actor_id=actor_id
            )
        except Exception:
            logger.warning(
                "Failed to set display_name for newly created user %s", user_id
            )

    write_audit_log(
        user_id=actor_id,
        action="ADMIN_CREATED" if role == "admin" else "USER_CREATED",
        target_type="user",
        target_id=user_id,
        meta={"role": role},
    )
    return get_user(user_id)


def list_users(
    *,
    keyword: str | None = None,
    role: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> dict[str, Any]:
    client = get_supabase_client()
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    query = (
        client.table("profiles")
        .select("*", count="exact")
        .is_("deleted_at", "null")
    )

    if status:
        if status not in ALLOWED_STATUSES:
            raise ValidationError("状態が不正です")
        query = query.eq("status", status)

    if keyword:
        keyword_term = sanitize_search_term(keyword)
        keyword_filter = build_or_filter(keyword_term, ["email", "display_name"])
        if keyword_filter:
            query = query.or_(keyword_filter)

    result = query.order("created_at", desc=True).range(start, end).execute()
    profiles = result.data or []
    ids = [row["id"] for row in profiles]
    role_map: dict[str, str] = {}
    if ids:
        roles = (
            client.table("user_roles")
            .select("user_id,role")
            .in_("user_id", ids)
            .execute()
            .data
            or []
        )
        role_map = {row["user_id"]: row["role"] for row in roles}

    items = [_normalize_user(row, role_map.get(row["id"])) for row in profiles]
    if role:
        if role not in ALLOWED_ROLES:
            raise ValidationError("権限が不正です")
        items = [item for item in items if item["role"] == role]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": len(items) if role else (result.count or len(items)),
    }


def get_user(user_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    rows = (
        client.table("profiles")
        .select("*")
        .eq("id", user_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
        .data
        or []
    )
    profile = rows[0] if rows else None
    if not profile:
        raise UserNotFoundError("ユーザーが見つかりません")
    role_rows = (
        client.table("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    role_row = role_rows[0] if role_rows else None
    from services.mfa_service import fetch_mfa_enabled

    return _normalize_user(
        profile,
        (role_row or {}).get("role"),
        mfa_enabled=fetch_mfa_enabled(user_id),
    )


def update_profile(
    user_id: str,
    payload: dict[str, Any],
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    get_user(user_id)
    data: dict[str, Any] = {"updated_at": _now_iso()}
    if "display_name" in payload:
        name = str(payload.get("display_name") or "").strip()
        if not name:
            raise ValidationError("名前を入力してください")
        data["display_name"] = name
    if "avatar_url" in payload:
        avatar = str(payload.get("avatar_url") or "").strip()
        data["avatar_url"] = avatar or None

    client = get_supabase_client()
    result = client.table("profiles").update(data).eq("id", user_id).execute()
    if not result.data:
        raise UserNotFoundError("ユーザーが見つかりません")

    write_audit_log(
        user_id=actor_id,
        action="USER_PROFILE_UPDATED",
        target_type="user",
        target_id=user_id,
        meta={"fields": list(data.keys())},
    )
    return get_user(user_id)


MSG_LAST_ADMIN = (
    "有効な管理者が1人もいなくなるため、この操作はできません。"
    "先に別のユーザーを管理者にしてください。"
)


def _reject_self_change(user_id: str, actor_id: str | None, message: str) -> None:
    if actor_id and actor_id == user_id:
        raise SelfModificationError(message)


def _count_active_admins() -> int:
    """Admins who can actually use the CMS: role=admin AND profile active
    AND not deleted (same rule utils.auth enforces per request)."""
    client = get_supabase_client()
    admin_ids = [
        row["user_id"]
        for row in (
            client.table("user_roles").select("user_id").eq("role", "admin").execute().data
            or []
        )
    ]
    if not admin_ids:
        return 0
    active = (
        client.table("profiles")
        .select("id")
        .in_("id", admin_ids)
        .eq("status", "active")
        .is_("deleted_at", "null")
        .execute()
        .data
        or []
    )
    return len(active)


def _is_active_admin(user: dict[str, Any]) -> bool:
    return (
        user.get("role") == "admin"
        and (user.get("status") or "active") == "active"
        and not user.get("deleted_at")
    )


def _ensure_other_active_admin(target: dict[str, Any]) -> None:
    """Pre-check: refuse a change that would remove `target`'s admin access
    when target is the only usable admin left. Concurrent changes are
    caught by the post-check in each caller (no DB lock is available
    without a migration, so the fallback is check -> change -> re-count ->
    undo our own change if the count hit zero)."""
    if _is_active_admin(target) and _count_active_admins() <= 1:
        raise LastAdminError(MSG_LAST_ADMIN)


def _write_role(client: Any, user_id: str, role: str, *, exists: bool) -> None:
    if exists:
        client.table("user_roles").update(
            {"role": role, "updated_at": _now_iso()}
        ).eq("user_id", user_id).execute()
    else:
        client.table("user_roles").insert(
            {
                "user_id": user_id,
                "role": role,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        ).execute()


def update_role(
    user_id: str,
    role: str,
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    if role not in ALLOWED_ROLES:
        raise ValidationError("権限が不正です")
    _reject_self_change(user_id, actor_id, "自分自身の権限は変更できません")
    target = get_user(user_id)
    removes_admin = role != "admin"
    if removes_admin:
        _ensure_other_active_admin(target)

    client = get_supabase_client()
    # Not .maybe_single(): with postgrest-py 0.19 it returns None (not an
    # empty response) for zero rows, so `.data` crashed exactly when an
    # admin assigned a first role to a role-less user.
    existing_rows = (
        client.table("user_roles")
        .select("id,role")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    existing = existing_rows[0] if existing_rows else None
    previous = (existing or {}).get("role")
    _write_role(client, user_id, role, exists=bool(existing))

    if removes_admin and previous == "admin" and _count_active_admins() == 0:
        # Lost a race with a concurrent demotion/suspension: undo ours.
        _write_role(client, user_id, "admin", exists=True)
        invalidate_auth_cache(user_id)
        raise LastAdminError(MSG_LAST_ADMIN)

    invalidate_auth_cache(user_id)
    write_audit_log(
        user_id=actor_id,
        action="USER_ROLE_CHANGED",
        target_type="user",
        target_id=user_id,
        meta={"from": previous, "to": role},
    )
    return get_user(user_id)


def _set_auth_ban(user_id: str, *, banned: bool) -> None:
    """Ban / unban the Supabase Auth account itself.

    profiles.status alone is not enough: a suspended user could still sign
    in to Supabase Auth directly with the public anon key. A ban makes Auth
    refuse sign-in and token refresh. Runs on a throwaway client — see
    create_scoped_client() for why Auth-admin calls must not use the shared
    singleton.
    """
    create_scoped_client().auth.admin.update_user_by_id(
        user_id, {"ban_duration": AUTH_BAN_DURATION if banned else AUTH_UNBAN}
    )


def _update_profile_row(user_id: str, data: dict[str, Any]) -> None:
    result = (
        get_supabase_client()
        .table("profiles")
        .update({**data, "updated_at": _now_iso()})
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise UserNotFoundError("ユーザーが見つかりません")


def _compensate_unban(user_id: str) -> None:
    """Best-effort rollback of a ban we just applied. Supabase Auth and the
    profiles table are not one transaction, so if this also fails we can
    only log loudly for manual repair."""
    try:
        _set_auth_ban(user_id, banned=False)
    except Exception:
        logger.critical(
            "MANUAL FIX NEEDED: user %s is banned in Supabase Auth but the "
            "profiles update failed and the ban could not be rolled back",
            user_id,
        )


def _ban_then_update_profile(
    user_id: str,
    profile_data: dict[str, Any],
    *,
    was_active: bool,
) -> None:
    """Deactivation order: (1) ban in Auth, (2) update profiles.

    Banning first means a failure can never leave a deactivated profile
    whose Auth account still works. If step 2 fails, the ban is rolled
    back — but only when this call introduced it (the user was active);
    an already-inactive user keeps whatever ban they had.
    """
    try:
        _set_auth_ban(user_id, banned=True)
    except Exception as exc:
        logger.warning("auth ban failed for %s: %s", user_id, exc)
        raise AccountSyncError(
            "Supabase Auth のアカウント停止に失敗したため、変更を中止しました。"
            "もう一度お試しください。"
        ) from exc

    try:
        _update_profile_row(user_id, profile_data)
    except Exception:
        if was_active:
            _compensate_unban(user_id)
        raise


def update_status(
    user_id: str,
    status: str,
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    if status not in ALLOWED_STATUSES:
        raise ValidationError("状態が不正です")
    _reject_self_change(user_id, actor_id, "自分自身のステータスは変更できません")
    current = get_user(user_id)
    previous_status = current.get("status") or "active"
    if status != "active":
        _ensure_other_active_admin(current)

    if status == "active":
        # Reactivation order: (1) profiles -> active, (2) lift the Auth ban.
        # If the unban fails, restore the previous status so the account is
        # not left "active" in the CMS while Auth still refuses it.
        _update_profile_row(user_id, {"status": "active"})
        try:
            _set_auth_ban(user_id, banned=False)
        except Exception as exc:
            logger.warning("auth unban failed for %s: %s", user_id, exc)
            if previous_status != "active":
                try:
                    _update_profile_row(user_id, {"status": previous_status})
                except Exception:
                    logger.critical(
                        "MANUAL FIX NEEDED: user %s is active in profiles but "
                        "still banned in Supabase Auth",
                        user_id,
                    )
            raise AccountSyncError(
                "Supabase Auth のアカウント再開に失敗したため、変更を中止しました。"
                "もう一度お試しください。"
            ) from exc
    else:
        _ban_then_update_profile(
            user_id,
            {"status": status},
            was_active=previous_status == "active",
        )
        _undo_if_no_admin_left(current, restore={"status": previous_status})

    invalidate_auth_cache(user_id)
    write_audit_log(
        user_id=actor_id,
        action="USER_STATUS_CHANGED",
        target_type="user",
        target_id=user_id,
        meta={"status": status, "from": previous_status},
    )
    return get_user(user_id)


def _undo_if_no_admin_left(target: dict[str, Any], *, restore: dict[str, Any]) -> None:
    """Post-check for a deactivation (suspend / delete) of an admin.

    If a concurrent change also removed the other admin(s), undo *our*
    change — restore the profile, then lift the ban we applied — so the
    worst outcome of a race is "nothing changed", never "no admin left".
    """
    if not _is_active_admin(target) or _count_active_admins() > 0:
        return
    user_id = str(target["id"])
    try:
        _update_profile_row(user_id, restore)
        _set_auth_ban(user_id, banned=False)
    except Exception:
        logger.critical(
            "MANUAL FIX NEEDED: no active admin left and restoring user %s failed",
            user_id,
        )
    invalidate_auth_cache(user_id)
    raise LastAdminError(MSG_LAST_ADMIN)


def soft_delete_user(user_id: str, *, actor_id: str | None) -> dict[str, Any]:
    _reject_self_change(user_id, actor_id, "自分自身は削除できません")
    user = get_user(user_id)
    _ensure_other_active_admin(user)
    previous_status = user.get("status") or "active"
    deleted_at = _now_iso()
    _ban_then_update_profile(
        user_id,
        {"status": "inactive", "deleted_at": deleted_at},
        was_active=previous_status == "active",
    )
    _undo_if_no_admin_left(user, restore={"status": previous_status, "deleted_at": None})
    invalidate_auth_cache(user_id)

    write_audit_log(
        user_id=actor_id,
        action="USER_DELETED",
        target_type="user",
        target_id=user_id,
        meta={"email": user.get("email")},
    )
    return {**user, "status": "inactive", "deleted_at": deleted_at}


def touch_last_login(user_id: str) -> None:
    client = get_supabase_client()
    client.table("profiles").update(
        {"last_login_at": _now_iso(), "updated_at": _now_iso()}
    ).eq("id", user_id).execute()


def upload_avatar(
    *,
    user_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    actor_id: str | None,
) -> dict[str, Any]:
    import uuid

    from services.storage_service import upload_public_image
    from utils.validators import validate_image_file

    get_user(user_id)
    extension = validate_image_file(filename, content_type, len(file_bytes))
    object_path = f"users/{user_id}/avatar-{uuid.uuid4().hex}.{extension}"
    uploaded = upload_public_image(
        bucket="avatars",
        object_path=object_path,
        file_bytes=file_bytes,
        content_type=content_type or f"image/{extension}",
        upsert=True,
    )
    return update_profile(
        user_id,
        {"avatar_url": uploaded["url"]},
        actor_id=actor_id,
    )


def get_user_stats() -> dict[str, int]:
    client = get_supabase_client()
    profiles = (
        client.table("profiles")
        .select("id")
        .is_("deleted_at", "null")
        .execute()
        .data
        or []
    )
    ids = [row["id"] for row in profiles]
    roles = []
    if ids:
        roles = (
            client.table("user_roles")
            .select("role")
            .in_("user_id", ids)
            .execute()
            .data
            or []
        )

    admin_count = sum(1 for row in roles if row.get("role") == "admin")
    editor_count = sum(1 for row in roles if row.get("role") == "editor")
    viewer_count = sum(1 for row in roles if row.get("role") == "viewer")
    # Users without a role have no CMS access (utils.auth denies them), so
    # they are reported separately instead of being folded into viewer.
    unassigned_count = max(len(ids) - len(roles), 0)

    return {
        "total": len(ids),
        "admin_count": admin_count,
        "editor_count": editor_count,
        "viewer_count": viewer_count,
        "unassigned_count": unassigned_count,
    }
