from __future__ import annotations

from unittest.mock import patch

import pytest

from services import family_service
from services.family_service import CORE_COLUMNS, validate_family_payload
from utils.validators import ValidationError


@pytest.fixture(autouse=True)
def _mock_family_schema(monkeypatch):
    monkeypatch.setattr(
        family_service,
        "_family_schema_columns",
        set(CORE_COLUMNS),
    )


def test_sns_empty_string_becomes_null():
    data = validate_family_payload(
        {
            "name": "Test",
            "instagram_url": "   ",
            "youtube_url": "",
            "tiktok_url": None,
            "x_url": None,
        },
        partial=False,
    )
    assert data.get("instagram_url") is None
    assert data.get("youtube_url") is None
    assert data.get("tiktok_url") is None
    assert data.get("x_url") is None


def test_sns_partial_null_clears_field():
    data = validate_family_payload(
        {"instagram_url": None},
        partial=True,
    )
    assert "instagram_url" in data
    assert data["instagram_url"] is None
    assert "name" not in data


def test_sns_partial_omitted_field_not_included():
    data = validate_family_payload({"name": "Only Name"}, partial=True)
    assert data["name"] == "Only Name"
    assert "instagram_url" not in data
    assert "youtube_url" not in data


def test_sns_valid_platform_urls_accepted():
    data = validate_family_payload(
        {
            "name": "Test",
            "youtube_url": "https://www.youtube.com/@example",
            "instagram_url": "https://instagram.com/example",
            "tiktok_url": "https://www.tiktok.com/@example",
            "x_url": "https://x.com/example",
        },
        partial=False,
    )
    assert data["youtube_url"].startswith("https://www.youtube.com/")
    assert data["instagram_url"].startswith("https://instagram.com/")
    assert data["tiktok_url"].startswith("https://www.tiktok.com/")
    assert data["x_url"].startswith("https://x.com/")


@pytest.mark.parametrize(
    "field,url",
    [
        ("youtube_url", "javascript:alert(1)"),
        ("instagram_url", "https://evil.example.com/phish"),
        ("tiktok_url", "data:text/html,hi"),
        ("x_url", "ftp://x.com/user"),
    ],
)
def test_sns_invalid_urls_rejected(field: str, url: str):
    with pytest.raises(ValidationError):
        validate_family_payload({field: url}, partial=True)


def test_update_route_accepts_null_sns():
    from app import create_app

    app = create_app()
    client = app.test_client()
    with patch(
        "routes.family_routes.family_service.update_family_profile"
    ) as mocked, patch(
        "routes.family_routes.require_editor",
        return_value=(type("U", (), {"id": "u1"})(), None),
    ):
        mocked.return_value = {
            "id": "p1",
            "name": "Test",
            "instagram_url": None,
            "is_visible": True,
        }
        response = client.patch(
            "/api/family/p1",
            json={"instagram_url": None},
        )
        assert response.status_code == 200
        mocked.assert_called_once()
        payload = mocked.call_args.args[1]
        assert payload.get("instagram_url") is None
