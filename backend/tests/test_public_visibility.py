"""Auth / public visibility gate smoke tests (no live Supabase)."""

from __future__ import annotations

from unittest.mock import patch

from app import create_app


def test_cms_posts_list_requires_auth():
    app = create_app()
    client = app.test_client()
    response = client.get("/api/posts")
    assert response.status_code in {401, 403}


def test_cms_post_detail_requires_auth():
    app = create_app()
    client = app.test_client()
    response = client.get("/api/posts/00000000-0000-0000-0000-000000000001")
    assert response.status_code in {401, 403}


def test_public_videos_force_visible():
    app = create_app()
    client = app.test_client()
    with patch("routes.youtube_routes.supabase_service.list_videos") as mocked:
        mocked.return_value = []
        response = client.get("/api/videos?is_visible=false")
        assert response.status_code == 200
        kwargs = mocked.call_args.kwargs
        assert kwargs.get("is_visible") is True


def test_public_gallery_forces_visible_only():
    app = create_app()
    client = app.test_client()
    with patch("routes.gallery_routes.gallery_service.list_gallery") as mocked:
        mocked.return_value = {"items": [], "total": 0, "page": 1, "limit": 24}
        response = client.get("/api/gallery")
        assert response.status_code == 200
        assert mocked.call_args.kwargs.get("visible_only") is True


def test_public_family_forces_visible_only():
    app = create_app()
    client = app.test_client()
    with patch("routes.family_routes.family_service.list_family_profiles") as mocked:
        mocked.return_value = []
        response = client.get("/api/family")
        assert response.status_code == 200
        assert mocked.call_args.kwargs.get("visible_only") is True
