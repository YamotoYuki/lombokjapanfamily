from __future__ import annotations

import logging
import os

import pytest

from utils import env_check


@pytest.fixture(autouse=True)
def _clear_security_env(monkeypatch: pytest.MonkeyPatch):
    for key in (
        "FLASK_ENV",
        "SECRET_KEY",
        "JWT_SECRET",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_JWT_SECRET",
        "CORS_ORIGINS",
        "TURNSTILE_SECRET_KEY",
        "SUPABASE_SSL_VERIFY",
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "ADMIN_CONTACT_EMAIL",
        "MAIL_PROVIDER",
    ):
        monkeypatch.delenv(key, raising=False)


def test_production_refuses_weak_secret(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.setenv("SECRET_KEY", "dev-only-change-me")
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "turnstile")
    monkeypatch.setenv("SUPABASE_SSL_VERIFY", "true")
    log = logging.getLogger("test.env")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        env_check.validate_runtime_env(log)


def test_production_refuses_ssl_verify_off(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.setenv("SECRET_KEY", "strong-enough-secret-key-value")
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "turnstile")
    monkeypatch.setenv("SUPABASE_SSL_VERIFY", "false")
    log = logging.getLogger("test.env")
    with pytest.raises(RuntimeError, match="SUPABASE_SSL_VERIFY"):
        env_check.validate_runtime_env(log)


def test_production_requires_turnstile(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.setenv("SECRET_KEY", "strong-enough-secret-key-value")
    monkeypatch.setenv("SUPABASE_SSL_VERIFY", "true")
    log = logging.getLogger("test.env")
    with pytest.raises(RuntimeError, match="TURNSTILE"):
        env_check.validate_runtime_env(log)


def test_development_allows_missing_turnstile(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("FLASK_ENV", "development")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.setenv("SECRET_KEY", "dev-only-change-me")
    log = logging.getLogger("test.env")
    flags = env_check.validate_runtime_env(log)
    assert flags["supabase_url"] is True


def test_version_hides_flask_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("FLASK_ENV", "testing")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)

    from app import create_app

    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as client:
        payload = client.get("/version").get_json()
    assert "env" not in payload["data"]
