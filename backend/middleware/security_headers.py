from __future__ import annotations

from flask import Flask

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-XSS-Protection": "0",
}


def register_security_headers(app: Flask) -> None:
    @app.after_request
    def _set_security_headers(response):  # type: ignore[no-untyped-def]
        for key, value in SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)
        # API responses should not be cached by shared proxies by default
        if request_is_api():
            response.headers.setdefault("Cache-Control", "no-store")
        return response


def request_is_api() -> bool:
    from flask import request

    return request.path.startswith("/api/") or request.path in {"/health", "/version"}
