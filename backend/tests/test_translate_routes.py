from unittest.mock import patch

import pytest


@pytest.fixture()
def translate_app(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "testing")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)

    from app import create_app
    from routes import translate_routes

    monkeypatch.setattr(
        translate_routes, "require_editor", lambda: ({"role": "editor"}, None)
    )

    app = create_app()
    app.config.update(TESTING=True)
    return app


def _fake_mymemory(text: str, *, source: str, target: str) -> str:
    """Deterministic stand-in for the real MyMemory HTTP call."""
    return f"[{source}->{target}] {text}"


@pytest.mark.parametrize(
    "source,target",
    [
        ("ja", "en"),
        ("ja", "id"),
        ("en", "ja"),
        ("en", "id"),
        ("id", "ja"),
        ("id", "en"),
    ],
)
def test_all_six_directions_translate(translate_app, source, target):
    with patch(
        "services.translate_service._mymemory_translate",
        side_effect=_fake_mymemory,
    ):
        with translate_app.test_client() as client:
            res = client.post(
                "/api/translate",
                json={"fields": {"title": "hello"}, "source": source, "target": target},
            )
    assert res.status_code == 200
    body = res.get_json()
    assert body["ok"] is True
    assert body["data"]["source"] == source
    assert body["data"]["fields"]["title"] == f"[{source}->{target}] hello"


def test_rejects_same_source_and_target(translate_app):
    with translate_app.test_client() as client:
        res = client.post(
            "/api/translate",
            json={"fields": {"title": "hello"}, "source": "ja", "target": "ja"},
        )
    assert res.status_code == 400
    assert res.get_json()["ok"] is False


def test_rejects_unknown_target(translate_app):
    with translate_app.test_client() as client:
        res = client.post(
            "/api/translate",
            json={"fields": {"title": "hello"}, "source": "ja", "target": "fr"},
        )
    assert res.status_code == 400


def test_auto_detects_japanese_source(translate_app):
    with patch(
        "services.translate_service._mymemory_translate",
        side_effect=_fake_mymemory,
    ):
        with translate_app.test_client() as client:
            res = client.post(
                "/api/translate",
                json={
                    "fields": {"title": "こんにちは家族"},
                    "source": "auto",
                    "target": "en",
                },
            )
    assert res.status_code == 200
    body = res.get_json()
    assert body["data"]["source"] == "ja"


def test_auto_detects_indonesian_source(translate_app):
    with patch(
        "services.translate_service._mymemory_translate",
        side_effect=_fake_mymemory,
    ):
        with translate_app.test_client() as client:
            res = client.post(
                "/api/translate",
                json={
                    "fields": {
                        "title": "Besok kami akan mengadakan acara keluarga dengan semua"
                    },
                    "source": "auto",
                    "target": "en",
                },
            )
    assert res.status_code == 200
    assert res.get_json()["data"]["source"] == "id"


def test_auto_detects_english_source(translate_app):
    with patch(
        "services.translate_service._mymemory_translate",
        side_effect=_fake_mymemory,
    ):
        with translate_app.test_client() as client:
            res = client.post(
                "/api/translate",
                json={
                    "fields": {
                        "title": "We will hold a family event tomorrow with all of them"
                    },
                    "source": "auto",
                    "target": "id",
                },
            )
    assert res.status_code == 200
    assert res.get_json()["data"]["source"] == "en"


def test_auto_detect_ambiguous_text_is_rejected(translate_app):
    with translate_app.test_client() as client:
        res = client.post(
            "/api/translate",
            json={"fields": {"title": "1234 !!"}, "source": "auto", "target": "en"},
        )
    assert res.status_code == 400
    assert "自動判定できませんでした" in res.get_json()["message"]


def test_missing_source_defaults_to_japanese(translate_app):
    """Backward compatibility: older callers that never send `source` keep
    getting the original ja -> target behavior."""
    with patch(
        "services.translate_service._mymemory_translate",
        side_effect=_fake_mymemory,
    ):
        with translate_app.test_client() as client:
            res = client.post(
                "/api/translate",
                json={"fields": {"title": "hello"}, "target": "en"},
            )
    assert res.status_code == 200
    assert res.get_json()["data"]["source"] == "ja"


def test_unauthenticated_request_is_rejected():
    """No require_editor patch here — the real permission gate must reject
    a request with no Authorization header before any translation runs."""
    import os

    os.environ.setdefault("FLASK_ENV", "testing")
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
    os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
    os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")

    from app import create_app

    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as client:
        res = client.post(
            "/api/translate",
            json={"fields": {"title": "hello"}, "source": "ja", "target": "en"},
        )
    assert res.status_code == 401
