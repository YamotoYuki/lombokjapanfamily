from __future__ import annotations

import os

from flask import Flask

# API JSON responses: deny embedding / script execution in browsers that honor CSP.
API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"

# SPA / HTML (also mirrored in frontend/nginx.conf). Allows app + known CDNs only.
# 'unsafe-inline' remains for GTM bootstrap + Tailwind runtime; tighten with nonces later.
SPA_CSP = "; ".join(
    [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        (
            "script-src 'self' 'unsafe-inline' "
            "https://challenges.cloudflare.com "
            "https://www.googletagmanager.com "
            "https://www.google-analytics.com "
            "https://*.supabase.co"
        ),
        (
            "style-src 'self' 'unsafe-inline' "
            "https://fonts.googleapis.com"
        ),
        "font-src 'self' https://fonts.gstatic.com data:",
        (
            "img-src 'self' data: blob: https: "
        ),
        (
            "connect-src 'self' "
            "https://*.supabase.co wss://*.supabase.co "
            "https://challenges.cloudflare.com "
            "https://www.google-analytics.com "
            "https://*.google-analytics.com "
            "https://*.analytics.google.com "
            "https://www.googletagmanager.com "
            "https://*.sentry.io"
        ),
        (
            "frame-src "
            "https://challenges.cloudflare.com "
            "https://www.googletagmanager.com "
            "https://www.youtube.com "
            "https://www.youtube-nocookie.com"
        ),
        "media-src 'self' blob: https:",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
    ]
)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-XSS-Protection": "0",
}


def _content_security_policy() -> str:
    """Allow CSP override via env; default to API-safe policy for Flask."""
    override = os.getenv("CONTENT_SECURITY_POLICY", "").strip()
    if override:
        return override
    return API_CSP


def register_security_headers(app: Flask) -> None:
    @app.after_request
    def _set_security_headers(response):  # type: ignore[no-untyped-def]
        for key, value in SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)

        # Prefer explicit CSP; do not clobber if upstream already set one.
        response.headers.setdefault(
            "Content-Security-Policy",
            _content_security_policy(),
        )

        if os.getenv("FLASK_ENV", "").strip().lower() == "production":
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        if request_is_api():
            response.headers.setdefault("Cache-Control", "no-store")
        return response


def request_is_api() -> bool:
    from flask import request

    return request.path.startswith("/api/") or request.path in {"/health", "/version"}
