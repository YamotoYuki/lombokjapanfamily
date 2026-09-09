"""Gallery multilingual (title/description/location *_en/*_id) save-path
safety.

Root cause (STEP: gallery translation save investigation): the connected
Supabase project's `gallery` table may not yet have the i18n columns from
`supabase/migrations/20260331000001_cms_i18n_fields.sql` (title/description)
or `supabase/migrations/20260909000000_gallery_location_i18n.sql` (location)
applied. Before this fix, `_prepare_gallery_for_storage` silently dropped
translated en/id content in that case — the save looked successful but the
translation vanished. Now it raises a clear ValidationError instead, and
ja-only saves (which always have a legacy column as a landing spot) are
unaffected.

Both i18n probes (`_gallery_has_i18n_columns` /
`_gallery_has_location_i18n_columns`) are `lru_cache`d and hit the live DB
when not mocked, so every test here mocks both explicitly to stay isolated
and avoid cross-test cache contamination.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from services import gallery_service
from utils.validators import ValidationError


def _mock_schema(monkeypatch, *, title_desc: bool, location: bool):
    monkeypatch.setattr(
        gallery_service, "_gallery_has_i18n_columns", lambda: title_desc
    )
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: location
    )


# ---------------------------------------------------------------------------
# _prepare_gallery_for_storage — title / description
# ---------------------------------------------------------------------------


def test_i18n_columns_present_keeps_all_translations(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=True)
    data = {
        "title": "Test",
        "title_ja": "Test",
        "title_en": "Test EN",
        "title_id": "Test ID",
        "description_ja": "desc ja",
        "description_en": "desc en",
        "description_id": "desc id",
    }
    out = gallery_service._prepare_gallery_for_storage(dict(data))
    assert out == data


def test_i18n_columns_missing_with_translation_raises_validation_error(monkeypatch):
    _mock_schema(monkeypatch, title_desc=False, location=True)
    data = {
        "title": "Test",
        "title_ja": "Test",
        "title_en": "Test EN",
        "description_ja": "desc",
    }
    with pytest.raises(ValidationError):
        gallery_service._prepare_gallery_for_storage(data)


def test_i18n_columns_missing_description_id_only_still_raises(monkeypatch):
    """Any one of the four lossy fields being non-empty is enough to trigger it."""
    _mock_schema(monkeypatch, title_desc=False, location=True)
    data = {"title": "Test", "description_id": "Deskripsi"}
    with pytest.raises(ValidationError):
        gallery_service._prepare_gallery_for_storage(data)


def test_i18n_columns_missing_ja_only_still_saves(monkeypatch):
    """No en/id content to lose -> legacy ja-only save keeps working."""
    _mock_schema(monkeypatch, title_desc=False, location=True)
    data = {
        "title": "Test",
        "title_ja": "Test",
        "title_en": None,
        "title_id": "",
        "description_ja": "desc",
        "description_en": None,
        "description_id": "   ",  # whitespace-only counts as empty
    }
    out = gallery_service._prepare_gallery_for_storage(data)
    assert out["title"] == "Test"
    for key in gallery_service.GALLERY_I18N_FIELDS:
        assert key not in out


# ---------------------------------------------------------------------------
# _prepare_gallery_for_storage — location
# ---------------------------------------------------------------------------


def test_location_i18n_columns_present_keeps_translations(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=True)
    data = {
        "location": "Tokyo",
        "location_ja": "Tokyo",
        "location_en": "Tokyo, Japan",
        "location_id": "Tokyo, Jepang",
    }
    out = gallery_service._prepare_gallery_for_storage(dict(data))
    assert out == data


def test_location_i18n_columns_missing_with_translation_raises(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=False)
    data = {"location": "Tokyo", "location_ja": "Tokyo", "location_en": "Tokyo, Japan"}
    with pytest.raises(ValidationError):
        gallery_service._prepare_gallery_for_storage(data)


def test_location_i18n_columns_missing_id_only_still_raises(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=False)
    data = {"location_id": "Tokyo, Jepang"}
    with pytest.raises(ValidationError):
        gallery_service._prepare_gallery_for_storage(data)


def test_location_i18n_columns_missing_ja_only_still_saves(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=False)
    data = {
        "location": "Tokyo",
        "location_ja": "Tokyo",
        "location_en": None,
        "location_id": "",
    }
    out = gallery_service._prepare_gallery_for_storage(data)
    assert out["location"] == "Tokyo"
    for key in gallery_service.GALLERY_LOCATION_I18N_FIELDS:
        assert key not in out


def test_title_desc_and_location_columns_are_independent(monkeypatch):
    """title/description migration applied, location migration is not (or
    vice versa) — each gate must fire independently of the other."""
    _mock_schema(monkeypatch, title_desc=True, location=False)
    data = {
        "title": "Test",
        "title_ja": "Test",
        "title_en": "Test EN",
        "location_en": "Tokyo, Japan",
    }
    with pytest.raises(ValidationError):
        gallery_service._prepare_gallery_for_storage(data)


# ---------------------------------------------------------------------------
# create_gallery_item / update_gallery_item
# ---------------------------------------------------------------------------


def test_create_gallery_item_raises_before_any_db_write_when_lossy(monkeypatch):
    _mock_schema(monkeypatch, title_desc=False, location=True)
    with patch("services.gallery_service.get_supabase_client") as mocked_client:
        payload = {
            "title_ja": "テスト",
            "title_en": "Test",
            "image_url": "https://example.supabase.co/storage/v1/object/public/gallery/x.jpg",
        }
        with pytest.raises(ValidationError):
            gallery_service.create_gallery_item(payload)
        # The failure must happen before touching Supabase at all.
        mocked_client.assert_not_called()


def test_create_gallery_item_ja_only_still_writes_to_db(monkeypatch):
    _mock_schema(monkeypatch, title_desc=False, location=True)
    with patch("services.gallery_service.get_supabase_client") as mocked_client, patch(
        "services.gallery_service.get_gallery_item"
    ) as mocked_get:
        table = MagicMock()
        mocked_client.return_value = table
        table.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "new-id"}]
        )
        mocked_get.return_value = {"id": "new-id", "title": "テスト"}

        payload = {
            "title_ja": "テスト",
            "image_url": "https://example.supabase.co/storage/v1/object/public/gallery/x.jpg",
        }
        result = gallery_service.create_gallery_item(payload)
        assert result["id"] == "new-id"
        mocked_client.assert_called()


def test_create_gallery_item_raises_before_db_write_when_location_lossy(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=False)
    with patch("services.gallery_service.get_supabase_client") as mocked_client:
        payload = {
            "title_ja": "テスト",
            "location_ja": "東京",
            "location_id": "Tokyo, Jepang",
            "image_url": "https://example.supabase.co/storage/v1/object/public/gallery/x.jpg",
        }
        with pytest.raises(ValidationError):
            gallery_service.create_gallery_item(payload)
        mocked_client.assert_not_called()


def test_update_gallery_item_raises_before_any_db_write_when_lossy(monkeypatch):
    _mock_schema(monkeypatch, title_desc=False, location=True)
    monkeypatch.setattr(
        gallery_service, "get_gallery_item", lambda item_id: {"id": item_id}
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client:
        with pytest.raises(ValidationError):
            gallery_service.update_gallery_item("existing-id", {"title_en": "Test EN"})
        mocked_client.assert_not_called()


def test_update_gallery_item_raises_before_db_write_when_location_lossy(monkeypatch):
    _mock_schema(monkeypatch, title_desc=True, location=False)
    monkeypatch.setattr(
        gallery_service, "get_gallery_item", lambda item_id: {"id": item_id}
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client:
        with pytest.raises(ValidationError):
            gallery_service.update_gallery_item(
                "existing-id", {"location_en": "Tokyo, Japan"}
            )
        mocked_client.assert_not_called()


# ---------------------------------------------------------------------------
# DB error details must never reach the HTTP client
# ---------------------------------------------------------------------------


def test_create_gallery_route_hides_db_exception_details(monkeypatch):
    # "testing" is enough to exercise utils.response.error()'s non-development
    # detail-hiding branch without also tripping the strict production
    # boot-time security gate (which needs a full prod-grade env to pass).
    monkeypatch.setenv("FLASK_ENV", "testing")
    from app import create_app

    app = create_app()
    client = app.test_client()

    fake_actor = MagicMock(id="actor-1")
    with patch(
        "routes.gallery_routes.require_editor", return_value=(fake_actor, None)
    ), patch(
        "routes.gallery_routes.gallery_service.create_gallery_item",
        side_effect=RuntimeError(
            "duplicate key value violates unique constraint gallery_pkey secret-looking-detail"
        ),
    ):
        response = client.post("/api/gallery", json={"title_ja": "x"})

    assert response.status_code == 500
    body = response.get_json()
    assert body["ok"] is False
    assert "details" not in body
    assert "secret-looking-detail" not in str(body)
