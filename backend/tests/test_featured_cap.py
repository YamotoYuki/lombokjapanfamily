"""Boundary tests for the "featured" count caps added alongside the
public-facing featured surfacing (gallery, announcements) and the
existing videos featured flag.

Caps: videos=6, gallery=6, announcements=3 (each matches its public
display limit). Turning a featured flag OFF must always succeed
regardless of how many other items are currently featured, and
re-saving an item that is already featured must not double-count
itself against the cap.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from services import announcement_service, gallery_service
from utils.validators import ValidationError


def _count_query(count: int, *, count_with_exclude: int | None = None):
    """Build a MagicMock mimicking `.select(...).eq(...)[.neq(...)].execute().count`.

    A real Supabase `.neq("id", x)` filter removes exactly the row for `x`
    from the count, so applying it should return one fewer than the
    unfiltered count (unless the caller says otherwise). Modeling that here
    (rather than returning the same fixed count regardless of `.neq()`)
    matters: it's what lets test_*_resaving_self_still_succeeds actually
    exercise the exclude_id path instead of trivially failing.
    """
    if count_with_exclude is None:
        count_with_exclude = max(count - 1, 0)
    query = MagicMock()
    query.eq.return_value = query
    excluded_query = MagicMock()
    excluded_query.execute.return_value = MagicMock(count=count_with_exclude)
    query.neq.return_value = excluded_query
    query.execute.return_value = MagicMock(count=count)
    return query


# ---------------------------------------------------------------------------
# Gallery (cap = 6)
# ---------------------------------------------------------------------------


def test_gallery_under_cap_allows_featuring(monkeypatch):
    monkeypatch.setattr(gallery_service, "_gallery_has_i18n_columns", lambda: True)
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: True
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client, patch(
        "services.gallery_service.get_gallery_item"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(5)
        client.table.return_value.insert.return_value.execute.return_value = (
            MagicMock(data=[{"id": "new-id"}])
        )
        mocked_get.return_value = {"id": "new-id"}

        result = gallery_service.create_gallery_item(
            {
                "title_ja": "テスト",
                "image_url": "https://example.supabase.co/storage/v1/object/public/gallery/x.jpg",
                "is_featured": True,
            }
        )
        assert result["id"] == "new-id"


def test_gallery_at_cap_rejects_new_featured_item(monkeypatch):
    monkeypatch.setattr(gallery_service, "_gallery_has_i18n_columns", lambda: True)
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: True
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(6)

        with pytest.raises(ValidationError, match="6件"):
            gallery_service.create_gallery_item(
                {
                    "title_ja": "テスト",
                    "image_url": "https://example.supabase.co/storage/v1/object/public/gallery/x.jpg",
                    "is_featured": True,
                }
            )
        # Rejected before any insert was attempted.
        client.table.return_value.insert.assert_not_called()


def test_gallery_at_cap_resaving_self_still_succeeds(monkeypatch):
    """Editing an item that is already featured must not count itself twice."""
    monkeypatch.setattr(gallery_service, "_gallery_has_i18n_columns", lambda: True)
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: True
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client, patch(
        "services.gallery_service.get_gallery_item"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        query = _count_query(6)
        client.table.return_value.select.return_value = query
        client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "existing-id"}]
        )
        mocked_get.return_value = {"id": "existing-id", "is_featured": True}

        result = gallery_service.update_gallery_item(
            "existing-id", {"is_featured": True}
        )
        assert result["id"] == "existing-id"
        # The exclude_id path must have been used (neq called on the count query).
        query.neq.assert_called_with("id", "existing-id")


def test_gallery_unfeature_always_succeeds_even_at_cap(monkeypatch):
    monkeypatch.setattr(gallery_service, "_gallery_has_i18n_columns", lambda: True)
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: True
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client, patch(
        "services.gallery_service.get_gallery_item"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        # No count query should even be needed when turning is_featured off,
        # but keep it available in case the implementation checks anyway.
        client.table.return_value.select.return_value = _count_query(6)
        client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "existing-id"}]
        )
        mocked_get.return_value = {"id": "existing-id", "is_featured": False}

        result = gallery_service.update_gallery_item(
            "existing-id", {"is_featured": False}
        )
        assert result["id"] == "existing-id"


def test_gallery_editing_other_field_at_cap_not_blocked(monkeypatch):
    """Changing display_order (not touching is_featured) must never be
    rejected just because the featured set happens to be full."""
    monkeypatch.setattr(gallery_service, "_gallery_has_i18n_columns", lambda: True)
    monkeypatch.setattr(
        gallery_service, "_gallery_has_location_i18n_columns", lambda: True
    )
    with patch("services.gallery_service.get_supabase_client") as mocked_client, patch(
        "services.gallery_service.get_gallery_item"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(6)
        client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "existing-id"}]
        )
        mocked_get.return_value = {"id": "existing-id"}

        result = gallery_service.update_gallery_item(
            "existing-id", {"display_order": 3}
        )
        assert result["id"] == "existing-id"


# ---------------------------------------------------------------------------
# Announcements (cap = 3)
# ---------------------------------------------------------------------------


def test_announcement_under_cap_allows_featuring():
    with patch(
        "services.announcement_service.get_supabase_client"
    ) as mocked_client:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(2)
        client.table.return_value.insert.return_value.execute.return_value = (
            MagicMock(data=[{"id": "new-id"}])
        )

        result = announcement_service.create_announcement(
            {"title_ja": "お知らせ", "content_ja": "本文", "is_featured": True}
        )
        assert result["id"] == "new-id"


def test_announcement_at_cap_rejects_new_featured_item():
    with patch(
        "services.announcement_service.get_supabase_client"
    ) as mocked_client:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(3)

        with pytest.raises(ValidationError, match="3件"):
            announcement_service.create_announcement(
                {"title_ja": "お知らせ", "content_ja": "本文", "is_featured": True}
            )
        client.table.return_value.insert.assert_not_called()


def test_announcement_at_cap_resaving_self_still_succeeds(monkeypatch):
    with patch(
        "services.announcement_service.get_supabase_client"
    ) as mocked_client, patch(
        "services.announcement_service.get_announcement"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        query = _count_query(3)
        client.table.return_value.select.return_value = query
        client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "existing-id"}]
        )
        mocked_get.return_value = {"id": "existing-id", "is_featured": True}

        result = announcement_service.update_announcement(
            "existing-id", {"is_featured": True}
        )
        assert result["id"] == "existing-id"
        query.neq.assert_called_with("id", "existing-id")


def test_announcement_unfeature_always_succeeds_even_at_cap():
    with patch(
        "services.announcement_service.get_supabase_client"
    ) as mocked_client, patch(
        "services.announcement_service.get_announcement"
    ) as mocked_get:
        client = MagicMock()
        mocked_client.return_value = client
        client.table.return_value.select.return_value = _count_query(3)
        client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "existing-id"}]
        )
        mocked_get.return_value = {"id": "existing-id", "is_featured": False}

        result = announcement_service.update_announcement(
            "existing-id", {"is_featured": False}
        )
        assert result["id"] == "existing-id"


# ---------------------------------------------------------------------------
# Videos (cap = 6) — enforced in the PATCH /api/videos/<id> route
# ---------------------------------------------------------------------------


@pytest.fixture()
def video_app(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "testing")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)

    from app import create_app
    from routes import youtube_routes

    monkeypatch.setattr(
        youtube_routes, "require_editor", lambda: ({"role": "editor"}, None)
    )

    app = create_app()
    app.config.update(TESTING=True)
    return app


def test_video_under_cap_allows_featuring(video_app):
    with patch(
        "routes.youtube_routes.supabase_service.count_featured_videos",
        return_value=5,
    ), patch(
        "routes.youtube_routes.supabase_service.update_video",
        return_value={"id": "vid-1", "is_featured": True},
    ):
        with video_app.test_client() as client:
            res = client.patch("/api/videos/vid-1", json={"is_featured": True})
        assert res.status_code == 200


def test_video_at_cap_rejects_new_featured_item(video_app):
    with patch(
        "routes.youtube_routes.supabase_service.count_featured_videos",
        return_value=6,
    ), patch(
        "routes.youtube_routes.supabase_service.update_video"
    ) as mocked_update:
        with video_app.test_client() as client:
            res = client.patch("/api/videos/vid-new", json={"is_featured": True})
        assert res.status_code == 400
        assert "6件" in res.get_json()["message"]
        mocked_update.assert_not_called()


def test_video_unfeature_always_succeeds_even_at_cap(video_app):
    with patch(
        "routes.youtube_routes.supabase_service.count_featured_videos",
        return_value=6,
    ), patch(
        "routes.youtube_routes.supabase_service.update_video",
        return_value={"id": "vid-1", "is_featured": False},
    ):
        with video_app.test_client() as client:
            res = client.patch("/api/videos/vid-1", json={"is_featured": False})
        assert res.status_code == 200


def test_video_editing_other_field_at_cap_not_blocked(video_app):
    with patch(
        "routes.youtube_routes.supabase_service.count_featured_videos"
    ) as mocked_count, patch(
        "routes.youtube_routes.supabase_service.update_video",
        return_value={"id": "vid-1", "display_order": 2},
    ):
        with video_app.test_client() as client:
            res = client.patch("/api/videos/vid-1", json={"display_order": 2})
        assert res.status_code == 200
        # The cap-count query only needs to run when is_featured is being set.
        mocked_count.assert_not_called()
