from __future__ import annotations

import pytest

from services.announcement_service import validate_announcement_payload
from utils.validators import ValidationError


def test_validate_requires_title_ja():
    with pytest.raises(ValidationError):
        validate_announcement_payload({"title_ja": "  ", "content_ja": "x"})


def test_validate_legacy_title_maps_to_ja():
    data = validate_announcement_payload(
        {"title": "旧タイトル", "content": "旧本文"},
        partial=False,
    )
    assert data["title_ja"] == "旧タイトル"
    assert data["title"] == "旧タイトル"
    assert data["content_ja"] == "旧本文"
    assert data["content"] == "旧本文"


def test_validate_i18n_fields():
    data = validate_announcement_payload(
        {
            "title_ja": "日本語",
            "title_en": "English",
            "title_id": "Indonesia",
            "content_ja": "本文JA",
            "content_en": "Body EN",
            "content_id": "",
            "category": "video",
        },
        partial=False,
    )
    assert data["title_ja"] == "日本語"
    assert data["title_en"] == "English"
    assert data["title_id"] == "Indonesia"
    assert data["content_en"] == "Body EN"
    assert data["content_id"] is None
    assert data["category"] == "video"


def test_validate_accepts_categories():
    for category in ("announcement", "video", "event", "update"):
        data = validate_announcement_payload(
            {"title_ja": "Hello", "content_ja": "Body", "category": category},
            partial=False,
        )
        assert data["category"] == category


def test_validate_rejects_bad_category():
    with pytest.raises(ValidationError):
        validate_announcement_payload(
            {"title_ja": "Hello", "category": "news"},
            partial=True,
        )


def test_validate_youtube_null_clears():
    data = validate_announcement_payload(
        {"youtube_url": None},
        partial=True,
    )
    assert "youtube_url" in data
    assert data["youtube_url"] is None


def test_validate_youtube_empty_clears():
    data = validate_announcement_payload(
        {"youtube_url": "  "},
        partial=True,
    )
    assert data["youtube_url"] is None


def test_validate_youtube_host():
    data = validate_announcement_payload(
        {"youtube_url": "https://www.youtube.com/watch?v=abc"},
        partial=True,
    )
    assert data["youtube_url"].startswith("https://www.youtube.com/")


def test_validate_rejects_non_youtube():
    with pytest.raises(ValidationError):
        validate_announcement_payload(
            {"youtube_url": "https://example.com/video"},
            partial=True,
        )


def test_validate_date_only_published_at():
    data = validate_announcement_payload(
        {"published_at": "2026-03-15"},
        partial=True,
    )
    assert data["published_at"].startswith("2026-03-15")


def test_create_route_requires_auth():
    from app import create_app

    app = create_app()
    client = app.test_client()
    response = client.post("/api/announcements", json={"title_ja": "T"})
    assert response.status_code in {401, 403}
