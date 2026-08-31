from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("RATE_LIMIT_DEFAULT", "1000 per minute")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)
    monkeypatch.delenv("CONTENT_SECURITY_POLICY", raising=False)

    from app import create_app

    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload["data"]["status"] == "ok"


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["ok"] is True


def test_version(client):
    response = client.get("/version")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert "version" in payload["data"]


def test_security_headers(client):
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    csp = response.headers.get("Content-Security-Policy", "")
    assert "default-src" in csp
    assert "frame-ancestors" in csp


def test_turnstile_skipped_without_secret(monkeypatch):
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)
    from services.turnstile_service import verify_turnstile_token

    verify_turnstile_token(None)  # no raise


def test_turnstile_requires_token_when_configured(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-turnstile-secret")
    from services.turnstile_service import verify_turnstile_token
    from utils.validators import ValidationError

    with pytest.raises(ValidationError):
        verify_turnstile_token("")


def test_turnstile_accepts_valid_token(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-turnstile-secret")
    from services.turnstile_service import verify_turnstile_token

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"success": True}

    with patch(
        "services.turnstile_service.requests.post",
        return_value=mock_response,
    ) as post:
        verify_turnstile_token("tok_abc", remote_ip="127.0.0.1")
        post.assert_called_once()


def test_mfa_user_has_verified_factor():
    from services.mfa_service import user_has_verified_mfa

    class Factor:
        status = "verified"

    class AuthUser:
        factors = [Factor()]

    assert user_has_verified_mfa(AuthUser()) is True
    assert user_has_verified_mfa(type("U", (), {"factors": []})()) is False
