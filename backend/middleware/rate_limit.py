from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from threading import Lock

from flask import Flask, request

limiter = None  # Flask-Limiter instance when available


class _SimpleLimiter:
    """Fallback fixed-window limiter when Flask-Limiter is unavailable."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            bucket = self._hits[key]
            while bucket and now - bucket[0] > self.window_seconds:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                return False
            bucket.append(now)
            return True


_simple: _SimpleLimiter | None = None


def _parse_default_limit(raw: str) -> tuple[int, int]:
    # Supports "100 per minute"
    text = (raw or "100 per minute").strip().lower()
    parts = text.split()
    try:
        count = int(parts[0])
    except (ValueError, IndexError):
        count = 100
    if "second" in text:
        return count, 1
    if "hour" in text:
        return count, 3600
    return count, 60


def init_rate_limiter(app: Flask):
    global limiter, _simple
    default_limit = os.getenv("RATE_LIMIT_DEFAULT", "100 per minute")
    exempt = {"/health", "/api/health", "/version", "/api/version"}

    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address

        limiter = Limiter(
            key_func=get_remote_address,
            app=app,
            default_limits=[default_limit],
            storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
            strategy="fixed-window",
        )

        @limiter.request_filter
        def _exempt_probes() -> bool:
            return request.path in exempt

        return limiter
    except Exception:
        count, window = _parse_default_limit(default_limit)
        _simple = _SimpleLimiter(max_requests=count, window_seconds=window)

        @app.before_request
        def _simple_rate_limit():  # type: ignore[no-untyped-def]
            if request.path in exempt:
                return None
            ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "unknown"
            if _simple and not _simple.allow(ip.split(",")[0].strip()):
                from flask import jsonify

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
            return None

        return _simple


def get_limiter():
    if limiter is None and _simple is None:
        raise RuntimeError("Rate limiter is not initialized")
    return limiter or _simple
