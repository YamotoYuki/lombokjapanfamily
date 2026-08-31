"""Helpers for Supabase Auth MFA factor inspection (admin API)."""

from __future__ import annotations

import logging
from typing import Any

from services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


def _factor_status(factor: Any) -> str | None:
    if factor is None:
        return None
    if isinstance(factor, dict):
        status = factor.get("status")
        return str(status) if status is not None else None
    status = getattr(factor, "status", None)
    return str(status) if status is not None else None


def user_has_verified_mfa(auth_user: Any) -> bool:
    factors = getattr(auth_user, "factors", None)
    if factors is None and isinstance(auth_user, dict):
        factors = auth_user.get("factors")
    if not factors:
        return False
    for factor in factors:
        if _factor_status(factor) == "verified":
            return True
    return False


def fetch_mfa_enabled(user_id: str) -> bool | None:
    """
    Return True/False when Auth Admin API succeeds, else None (unknown).
    """
    try:
        client = get_supabase_client()
        result = client.auth.admin.get_user_by_id(user_id)
        user = getattr(result, "user", None) or result
        return user_has_verified_mfa(user)
    except Exception as exc:  # noqa: BLE001 — best-effort enrichment
        logger.debug("MFA lookup failed for %s: %s", user_id, exc)
        return None


def fetch_mfa_map(user_ids: list[str]) -> dict[str, bool | None]:
    """Best-effort MFA flags for many users (list_users + per-id fallback)."""
    wanted = set(user_ids)
    out: dict[str, bool | None] = {uid: None for uid in user_ids}
    if not wanted:
        return out

    try:
        client = get_supabase_client()
        # Paginate a reasonable window; CMS lists are capped at 100.
        page = 1
        per_page = 200
        while page <= 5 and wanted:
            result = client.auth.admin.list_users(page=page, per_page=per_page)
            users = getattr(result, "users", None) or []
            if not users:
                break
            for auth_user in users:
                uid = getattr(auth_user, "id", None)
                if not uid or uid not in wanted:
                    continue
                out[uid] = user_has_verified_mfa(auth_user)
                wanted.discard(uid)
            if len(users) < per_page:
                break
            page += 1
    except Exception as exc:  # noqa: BLE001
        logger.debug("MFA list_users failed: %s", exc)

    # Fallback for ids missing from list page window
    for uid in list(wanted):
        out[uid] = fetch_mfa_enabled(uid)

    return out
