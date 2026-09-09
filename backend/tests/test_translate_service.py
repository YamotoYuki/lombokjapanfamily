import json
import urllib.error
from unittest.mock import MagicMock, patch

import pytest

from services.translate_service import (
    TranslationConnectionError,
    TranslationQuotaError,
    translate_fields,
)
from utils.validators import ValidationError


def test_translate_requires_source_text():
    with pytest.raises(ValidationError):
        translate_fields({"title": "  ", "content": ""}, target="en")


def test_translate_rejects_bad_target():
    with pytest.raises(ValidationError):
        translate_fields(
            {"title": "テスト"},
            target="fr",  # type: ignore[arg-type]
        )


def _mock_response(payload: dict) -> MagicMock:
    response = MagicMock()
    response.read.return_value = json.dumps(payload).encode("utf-8")
    response.__enter__.return_value = response
    response.__exit__.return_value = False
    return response


def test_translate_http_429_raises_quota_error(monkeypatch):
    """Persistent HTTP 429 (rate/quota limit) -> the quota-specific message,
    not the generic connection-failure one."""
    monkeypatch.setattr("services.translate_service.time.sleep", lambda *_: None)
    err = urllib.error.HTTPError("url", 429, "Too Many Requests", {}, None)
    with patch("urllib.request.urlopen", side_effect=err):
        with pytest.raises(TranslationQuotaError) as exc_info:
            translate_fields({"title": "テスト"}, target="en")
    assert "上限に達しました" in str(exc_info.value)


def test_translate_mymemory_warning_text_raises_quota_error(monkeypatch):
    """MyMemory signals daily-quota exhaustion as HTTP 200 with warning text
    embedded in the translation field, not an HTTP error status."""
    monkeypatch.setattr("services.translate_service.time.sleep", lambda *_: None)
    payload = {
        "responseData": {
            "translatedText": "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY"
        }
    }
    with patch("urllib.request.urlopen", return_value=_mock_response(payload)):
        with pytest.raises(TranslationQuotaError) as exc_info:
            translate_fields({"title": "テスト"}, target="en")
    assert "上限に達しました" in str(exc_info.value)


def test_translate_url_error_raises_connection_error(monkeypatch):
    """A genuine network failure (DNS/timeout/refused) -> the connection
    message, distinct from the quota message."""
    monkeypatch.setattr("services.translate_service.time.sleep", lambda *_: None)
    err = urllib.error.URLError("Temporary failure in name resolution")
    with patch("urllib.request.urlopen", side_effect=err):
        with pytest.raises(TranslationConnectionError) as exc_info:
            translate_fields({"title": "テスト"}, target="en")
    assert "接続できません" in str(exc_info.value)
    assert "上限" not in str(exc_info.value)


def test_translate_http_500_raises_connection_error(monkeypatch):
    """Non-quota HTTP error codes (not retried) -> connection message."""
    monkeypatch.setattr("services.translate_service.time.sleep", lambda *_: None)
    err = urllib.error.HTTPError("url", 500, "Internal Server Error", {}, None)
    with patch("urllib.request.urlopen", side_effect=err):
        with pytest.raises(TranslationConnectionError) as exc_info:
            translate_fields({"title": "テスト"}, target="en")
    assert "接続できません" in str(exc_info.value)


def test_translate_success_after_transient_502_retry(monkeypatch):
    """A transient 502 that clears on retry should still succeed normally,
    not be misclassified as quota or connection failure."""
    monkeypatch.setattr("services.translate_service.time.sleep", lambda *_: None)
    err = urllib.error.HTTPError("url", 502, "Bad Gateway", {}, None)
    ok_response = _mock_response(
        {"responseData": {"translatedText": "Test"}}
    )
    with patch("urllib.request.urlopen", side_effect=[err, ok_response]):
        result = translate_fields({"title": "テスト"}, target="en")
    assert result["title"] == "Test"
