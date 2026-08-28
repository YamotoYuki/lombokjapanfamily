from __future__ import annotations

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from utils.logging_config import setup_logging

logger = setup_logging("ljf.errors")


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        return (
            jsonify(
                {
                    "ok": False,
                    "message": exc.description or exc.name,
                    "status": exc.code,
                }
            ),
            exc.code or 500,
        )

    @app.errorhandler(429)
    def handle_rate_limit(exc):  # type: ignore[no-untyped-def]
        return (
            jsonify(
                {
                    "ok": False,
                    "message": "リクエストが多すぎます。しばらくしてから再試行してください。",
                    "status": 429,
                }
            ),
            429,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return (
            jsonify(
                {
                    "ok": False,
                    "message": "サーバーエラーが発生しました",
                    "status": 500,
                }
            ),
            500,
        )
