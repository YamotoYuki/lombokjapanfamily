from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from threading import Lock

from flask import Flask, request
from werkzeug.middleware.proxy_fix import ProxyFix

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
_contact_simple: _SimpleLimiter | None = None


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


def client_ip() -> str:
    """Real client IP, as resolved by ProxyFix (see init_rate_limiter) from
    X-Forwarded-For. Do not read CF-Connecting-IP or X-Forwarded-For here
    directly — trusting the wrong entry re-opens IP spoofing."""
    return (request.remote_addr or "unknown").strip()


def _too_many_response():
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


def init_rate_limiter(app: Flask):
    global limiter, _simple, _contact_simple

    # Topology: Client -> Cloudflare -> Render's load balancer -> this app.
    # That's exactly 2 trusted proxy hops in front of us, each appending its
    # observed peer IP to X-Forwarded-For. ProxyFix trusts only the value
    # x_for positions from the *right* of that header (Cloudflare's entry),
    # so attacker-supplied values prepended further left are never used, and
    # request.remote_addr becomes safe to read as-is below (see client_ip()).
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=2)  # type: ignore[method-assign]

    default_limit = os.getenv("RATE_LIMIT_DEFAULT", "100 per minute")
    contact_limit = os.getenv("RATE_LIMIT_CONTACT", "8 per minute")
    exempt = {"/health", "/api/health", "/version", "/api/version"}

    contact_count, contact_window = _parse_default_limit(contact_limit)
    _contact_simple = _SimpleLimiter(
        max_requests=contact_count,
        window_seconds=contact_window,
    )

    try:
        from flask_limiter import Limiter

        limiter = Limiter(
            key_func=client_ip,
            app=app,
            default_limits=[default_limit],
            storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
            strategy="fixed-window",
        )

        @limiter.request_filter
        def _exempt_probes() -> bool:
            return request.path in exempt

        @app.before_request
        def _contact_create_limit():  # type: ignore[no-untyped-def]
            if request.method != "POST":
                return None
            path = request.path.rstrip("/")
            if path not in {"/api/contacts"}:
                return None
            # Extra fixed-window on public contact create (defense in depth)
            if _contact_simple and not _contact_simple.allow(f"contact:{client_ip()}"):
                return _too_many_response()
            return None

        return limiter
    except Exception:
        count, window = _parse_default_limit(default_limit)
        _simple = _SimpleLimiter(max_requests=count, window_seconds=window)

        @app.before_request
        def _simple_rate_limit():  # type: ignore[no-untyped-def]
            if request.path in exempt:
                return None
            ip = client_ip()
            path = request.path.rstrip("/")
            if (
                request.method == "POST"
                and path == "/api/contacts"
                and _contact_simple
                and not _contact_simple.allow(f"contact:{ip}")
            ):
                return _too_many_response()
            if _simple and not _simple.allow(ip):
                return _too_many_response()
            return None

        return _simple


def get_limiter():
    if limiter is None and _simple is None:
        raise RuntimeError("Rate limiter is not initialized")
    return limiter or _simple
