from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from services.audit_service import write_audit_log
from services.supabase_service import get_supabase_client
from utils.auth import ALLOWED_ROLES, ALLOWED_STATUSES
from utils.validators import ValidationError


class UserNotFoundError(LookupError):
    pass


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
        "role": role or "viewer",
        "status": profile.get("status") or "active",
        "mfa_enabled": mfa_enabled,
        "last_login_at": profile.get("last_login_at"),
        "created_at": profile.get("created_at"),
        "updated_at": profile.get("updated_at"),
        "deleted_at": profile.get("deleted_at"),
    }


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
        query = query.or_(
            f"email.ilike.%{keyword}%,display_name.ilike.%{keyword}%"
        )

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


def update_role(
    user_id: str,
    role: str,
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    if role not in ALLOWED_ROLES:
        raise ValidationError("権限が不正です")
    get_user(user_id)
    client = get_supabase_client()
    existing = (
        client.table("user_roles")
        .select("id,role")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
        .data
    )
    previous = (existing or {}).get("role")
    if existing:
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

    write_audit_log(
        user_id=actor_id,
        action="USER_ROLE_CHANGED",
        target_type="user",
        target_id=user_id,
        meta={"from": previous, "to": role},
    )
    return get_user(user_id)


def update_status(
    user_id: str,
    status: str,
    *,
    actor_id: str | None,
) -> dict[str, Any]:
    if status not in ALLOWED_STATUSES:
        raise ValidationError("状態が不正です")
    get_user(user_id)
    client = get_supabase_client()
    result = (
        client.table("profiles")
        .update({"status": status, "updated_at": _now_iso()})
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise UserNotFoundError("ユーザーが見つかりません")

    write_audit_log(
        user_id=actor_id,
        action="USER_STATUS_CHANGED",
        target_type="user",
        target_id=user_id,
        meta={"status": status},
    )
    return get_user(user_id)


def soft_delete_user(user_id: str, *, actor_id: str | None) -> dict[str, Any]:
    user = get_user(user_id)
    client = get_supabase_client()
    client.table("profiles").update(
        {
            "status": "inactive",
            "deleted_at": _now_iso(),
            "updated_at": _now_iso(),
        }
    ).eq("id", user_id).execute()

    write_audit_log(
        user_id=actor_id,
        action="USER_DELETED",
        target_type="user",
        target_id=user_id,
        meta={"email": user.get("email")},
    )
    return {**user, "status": "inactive", "deleted_at": _now_iso()}


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
    # users without role counted as viewer in UX
    missing = max(len(ids) - len(roles), 0)
    viewer_count += missing

    return {
        "total": len(ids),
        "admin_count": admin_count,
        "editor_count": editor_count,
        "viewer_count": viewer_count,
    }
