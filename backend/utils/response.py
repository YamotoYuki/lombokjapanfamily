from __future__ import annotations

from typing import Any

from flask import jsonify


def success(data: Any = None, message: str | None = None, status: int = 200):
    payload: dict[str, Any] = {"ok": True}
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def error(message: str, status: int = 400, details: Any = None):
    payload: dict[str, Any] = {"ok": False, "message": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status
