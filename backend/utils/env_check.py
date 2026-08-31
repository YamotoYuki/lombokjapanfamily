"""Startup environment validation (no secrets logged)."""

from __future__ import annotations

import os
import re
from logging import Logger

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def _mask(value: str, keep: int = 6) -> str:
    if not value:
        return "(empty)"
    if len(value) <= keep * 2:
        return "***"
    return f"{value[:keep]}…{value[-4:]} (len={len(value)})"


def validate_runtime_env(logger: Logger) -> dict[str, bool]:
    """Log env status and return readiness flags. Never prints full secrets."""
    flask_env = os.getenv("FLASK_ENV", "production").strip()
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    jwt_secret = (
        os.getenv("SUPABASE_JWT_SECRET", "").strip()
        or os.getenv("JWT_SECRET", "").strip()
    )
    secret_key = os.getenv("SECRET_KEY", "").strip()
    cors = os.getenv("CORS_ORIGINS", "").strip()

    flags = {
        "supabase_url": bool(supabase_url) and supabase_url.startswith("https://"),
        "service_role": False,
        "jwt_secret": False,
        "secret_key": bool(secret_key)
        and secret_key not in {"change-me-to-a-long-random-string", "dev-only-change-me"},
        "cors": bool(cors),
    }

    logger.info("=== Env check (FLASK_ENV=%s) ===", flask_env or "(unset)")
    logger.info("SUPABASE_URL: %s", supabase_url or "(missing)")
    logger.info("CORS_ORIGINS: %s", cors or "(missing)")
    logger.info("SECRET_KEY: %s", _mask(secret_key) if secret_key else "(missing)")

    # Service role
    if not service_role:
        logger.warning(
            "SUPABASE_SERVICE_ROLE_KEY が未設定です。"
            " Dashboard → Settings → API → service_role / secret を backend/.env に設定してください。"
        )
    elif service_role.startswith("http://") or service_role.startswith("https://"):
        logger.error(
            "SUPABASE_SERVICE_ROLE_KEY に URL が入っています（%s）。"
            " これは誤りです。API URL ではなく Secret Key を設定してください。",
            service_role[:48],
        )
    elif "/rest/v1" in service_role:
        logger.error(
            "SUPABASE_SERVICE_ROLE_KEY が REST endpoint のようです。Secret Key に置き換えてください。"
        )
    else:
        flags["service_role"] = True
        logger.info("SUPABASE_SERVICE_ROLE_KEY: %s", _mask(service_role))

    # JWT secret
    if not jwt_secret:
        logger.warning(
            "SUPABASE_JWT_SECRET / JWT_SECRET が未設定です。"
            " Dashboard → Settings → API → JWT Secret を backend/.env に設定してください。"
            " 未設定の場合は Auth API フォールバックに依存します。"
        )
    else:
        flags["jwt_secret"] = True
        if _UUID_RE.match(jwt_secret):
            logger.warning(
                "JWT Secret が UUID 形式です。"
                " Dashboard の JWT Secret と一致しているか必ず確認してください。"
                " 値=%s",
                _mask(jwt_secret),
            )
        else:
            logger.info("SUPABASE_JWT_SECRET: %s", _mask(jwt_secret))

    if not flags["supabase_url"]:
        logger.error("SUPABASE_URL が不正または未設定です。")

    ready = flags["supabase_url"] and flags["service_role"]
    if ready:
        logger.info("Supabase 接続設定: READY（URL + service role）")
    else:
        logger.warning("Supabase 接続設定: NOT READY（不足キーあり）")

    return flags
