"""Cloudflare Turnstile verification for public forms."""

from __future__ import annotations

import logging
import os
from typing import Any

import requests

from utils.validators import ValidationError

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
TURNSTILE_TIMEOUT_SEC = 8


def turnstile_enabled() -> bool:
    """Secret present → verification is required."""
    return bool(os.getenv("TURNSTILE_SECRET_KEY", "").strip())


def verify_turnstile_token(
    token: str | None,
    *,
    remote_ip: str | None = None,
) -> None:
    """
    Verify a Turnstile response token.

    - If TURNSTILE_SECRET_KEY is unset: no-op (local/dev), logs once at warning.
    - If set: missing/invalid token raises ValidationError.
    """
    secret = os.getenv("TURNSTILE_SECRET_KEY", "").strip()
    if not secret:
        return

    cleaned = (token or "").strip()
    if not cleaned:
        raise ValidationError("セキュリティ確認を完了してください")

    payload: dict[str, Any] = {
        "secret": secret,
        "response": cleaned,
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        response = requests.post(
            TURNSTILE_VERIFY_URL,
            data=payload,
            timeout=TURNSTILE_TIMEOUT_SEC,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.warning("Turnstile verify request failed: %s", exc)
        raise ValidationError(
            "セキュリティ確認に失敗しました。時間をおいて再度お試しください",
        ) from exc
    except ValueError as exc:
        logger.warning("Turnstile verify returned non-JSON")
        raise ValidationError("セキュリティ確認に失敗しました") from exc

    if not data.get("success"):
        codes = data.get("error-codes") or []
        logger.info("Turnstile rejected token: %s", codes)
        raise ValidationError("セキュリティ確認に失敗しました。再度お試しください")
