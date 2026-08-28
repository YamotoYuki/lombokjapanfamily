from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from services.supabase_service import get_supabase_client
from utils.logging_config import get_audit_logger

audit_logger = get_audit_logger()


def write_audit_log(
    *,
    user_id: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    payload = {
        "user_id": user_id,
        "action": action,
        "target_type": target_type,
        "target_id": str(target_id) if target_id is not None else None,
        "meta": meta or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    audit_logger.info(
        "AUDIT action=%s user=%s target=%s:%s meta=%s",
        action,
        user_id,
        target_type,
        target_id,
        meta or {},
    )
    try:
        client = get_supabase_client()
        client.table("audit_logs").insert(payload).execute()
    except Exception as exc:
        audit_logger.error("Failed to persist audit log: %s", exc)
