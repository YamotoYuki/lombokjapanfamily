from __future__ import annotations

import os

import pytest

# Ensure create_app can boot without real secrets in CI
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("RATE_LIMIT_DEFAULT", "1000 per minute")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")


@pytest.fixture()
def client(monkeypatch):
    # Avoid real Supabase client construction during import of route modules
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")

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
