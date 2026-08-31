from __future__ import annotations

import time
import uuid
from typing import Callable

from flask import Flask, g, request

from utils.logging_config import setup_logging

logger = setup_logging("ljf.request")


def register_request_logging(app: Flask) -> None:
    @app.before_request
    def _start_timer() -> None:
        g.request_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex
        g._start_time = time.perf_counter()

    @app.after_request
    def _log_request(response):  # type: ignore[no-untyped-def]
        duration_ms = 0.0
        if hasattr(g, "_start_time"):
            duration_ms = (time.perf_counter() - g._start_time) * 1000
        response.headers["X-Request-Id"] = getattr(g, "request_id", "")
        logger.info(
            "%s %s -> %s (%.1fms) ip=%s",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            request.headers.get("X-Forwarded-For", request.remote_addr),
        )
        return response
