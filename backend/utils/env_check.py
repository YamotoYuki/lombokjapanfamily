"""Startup environment validation (no secrets logged)."""

from __future__ import annotations

import os
import re
from logging import Logger

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

WEAK_SECRET_KEYS = frozenset(
    {
        "",
        "dev-only-change-me",
        "change-me-to-a-long-random-string",
        "secret",
        "changeme",
    }
)


def is_production_runtime() -> bool:
    env = os.getenv("FLASK_ENV", "production").strip().lower()
    return env not in {"development", "dev", "testing", "test", "local"}


def _mask(value: str, keep: int = 6) -> str:
    if not value:
        return "(empty)"
    if len(value) <= keep * 2:
        return "***"
    return f"{value[:keep]}…{value[-4:]} (len={len(value)})"


def _ssl_verify_enabled() -> bool:
    raw = os.getenv("SUPABASE_SSL_VERIFY", "true").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def validate_runtime_env(logger: Logger) -> dict[str, bool]:
    """Log env status and return readiness flags. Never prints full secrets.

    In production, raises RuntimeError for fatal misconfiguration.
    """
    flask_env = os.getenv("FLASK_ENV", "production").strip()
    production = is_production_runtime()
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    jwt_secret = (
        os.getenv("SUPABASE_JWT_SECRET", "").strip()
        or os.getenv("JWT_SECRET", "").strip()
    )
    secret_key = os.getenv("SECRET_KEY", "").strip()
    cors = os.getenv("CORS_ORIGINS", "").strip()
    turnstile = os.getenv("TURNSTILE_SECRET_KEY", "").strip()
    fatal: list[str] = []

    flags = {
        "supabase_url": bool(supabase_url) and supabase_url.startswith("https://"),
        "service_role": False,
        "jwt_secret": False,
        "secret_key": bool(secret_key) and secret_key not in WEAK_SECRET_KEYS,
        "cors": bool(cors),
        "turnstile": bool(turnstile),
        "ssl_verify": _ssl_verify_enabled(),
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
        if production:
            fatal.append("SUPABASE_SERVICE_ROLE_KEY missing")
    elif service_role.startswith("http://") or service_role.startswith("https://"):
        logger.error(
            "SUPABASE_SERVICE_ROLE_KEY に URL が入っています（%s）。"
            " これは誤りです。API URL ではなく Secret Key を設定してください。",
            service_role[:48],
        )
        fatal.append("SUPABASE_SERVICE_ROLE_KEY looks like a URL")
    elif "/rest/v1" in service_role:
        logger.error(
            "SUPABASE_SERVICE_ROLE_KEY が REST endpoint のようです。Secret Key に置き換えてください。"
        )
        fatal.append("SUPABASE_SERVICE_ROLE_KEY looks like REST endpoint")
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
        if production:
            fatal.append("SUPABASE_URL missing or invalid")

    if not flags["secret_key"]:
        logger.warning(
            "SECRET_KEY が未設定または弱い値です。"
            " 本番では十分な長さのランダム文字列を設定してください。"
        )
        if production:
            fatal.append("SECRET_KEY missing or weak")

    if not flags["ssl_verify"]:
        msg = (
            "SUPABASE_SSL_VERIFY is disabled. "
            "TLS verification must stay enabled in production."
        )
        if production:
            logger.error(msg)
            fatal.append("SUPABASE_SSL_VERIFY=false not allowed in production")
        else:
            logger.warning("%s (allowed only for local/dev)", msg)

    if not flags["turnstile"]:
        if production:
            logger.error(
                "TURNSTILE_SECRET_KEY が未設定です。"
                " 本番の公開お問い合わせは Turnstile 必須です。"
            )
            fatal.append("TURNSTILE_SECRET_KEY required in production")
        else:
            logger.warning(
                "TURNSTILE_SECRET_KEY 未設定 — お問い合わせのボット対策はスキップされます。"
            )
    else:
        logger.info("TURNSTILE_SECRET_KEY: configured")

    if production and not cors:
        logger.warning(
            "CORS_ORIGINS が未設定です。本番では公式オリジンのみを明示してください。"
        )

    ready = flags["supabase_url"] and flags["service_role"]
    if ready:
        logger.info("Supabase 接続設定: READY（URL + service role）")
    else:
        logger.warning("Supabase 接続設定: NOT READY（不足キーあり）")

    # Contact mail is optional — never block startup; warn when unset.
    try:
        from services.mail_service import log_mail_startup

        log_mail_startup(logger)
    except Exception as exc:
        logger.warning("[MAIL] startup check failed: %s", exc)

    if fatal:
        joined = "; ".join(fatal)
        logger.error("[SECURITY] Refusing to start: %s", joined)
        raise RuntimeError(f"Production security check failed: {joined}")

    return flags
