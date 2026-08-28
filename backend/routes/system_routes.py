from __future__ import annotations

import os
from datetime import datetime, timezone

from flask import Blueprint

from utils.response import success

system_bp = Blueprint("system", __name__)

STARTED_AT = datetime.now(timezone.utc).isoformat()


@system_bp.get("/health")
@system_bp.get("/api/health")
def health():
    return success(
        {
            "status": "ok",
            "service": "lombok-japan-family-api",
            "started_at": STARTED_AT,
        }
    )


@system_bp.get("/version")
@system_bp.get("/api/version")
def version():
    return success(
        {
            "name": "lombok-japan-family-api",
            "version": os.getenv("APP_VERSION", "1.0.0"),
            "env": os.getenv("FLASK_ENV", "development"),
            "started_at": STARTED_AT,
        }
    )
