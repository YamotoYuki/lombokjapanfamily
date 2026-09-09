"""youtube_service.sync_videos_from_youtube() and the routes built on it.

This is the core logic extracted so it can be shared between the manual
"同期" button (POST /api/videos/sync, /api/admin/videos/sync) and the new
hourly background auto-sync thread in app.py — neither the extraction nor
the auto-sync addition should change the manual routes' response shape.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from services import youtube_service


def _channel_info():
    return {
        "id": "UC123",
        "title": "Lombok-Japan Family",
        "subscriber_count": 1000,
        "video_count": 42,
        "view_count": 999999,
        "thumbnail_url": "https://example.com/thumb.jpg",
    }


def test_sync_videos_from_youtube_upserts_and_returns_shape(monkeypatch):
    monkeypatch.setattr(youtube_service, "get_channel_info", lambda: _channel_info())
    monkeypatch.setattr(
        "services.youtube_stats_store.save_channel_stats", lambda payload: None
    )
    monkeypatch.setattr(
        youtube_service,
        "fetch_latest_videos",
        lambda max_pages=5: [{"youtube_id": "abc123", "title": "Test Video"}],
    )

    with patch("services.supabase_service.upsert_videos") as mocked_upsert:
        mocked_upsert.return_value = [{"id": "row-1", "youtube_id": "abc123"}]
        result = youtube_service.sync_videos_from_youtube()

    assert result["synced"] == 1
    assert result["items"] == [{"id": "row-1", "youtube_id": "abc123"}]
    assert result["channel"]["id"] == "UC123"
    assert result["channel"]["title"] == "Lombok-Japan Family"
    mocked_upsert.assert_called_once()


def test_sync_videos_from_youtube_no_videos_returns_zero(monkeypatch):
    monkeypatch.setattr(youtube_service, "get_channel_info", lambda: _channel_info())
    monkeypatch.setattr(
        "services.youtube_stats_store.save_channel_stats", lambda payload: None
    )
    monkeypatch.setattr(
        youtube_service, "fetch_latest_videos", lambda max_pages=5: []
    )

    with patch("services.supabase_service.upsert_videos") as mocked_upsert:
        result = youtube_service.sync_videos_from_youtube()

    assert result["synced"] == 0
    assert result["items"] == []
    assert result["channel"]["id"] == "UC123"
    mocked_upsert.assert_not_called()


def test_sync_videos_from_youtube_tolerates_stats_cache_failure(monkeypatch):
    """A broken local stats cache must not block the actual video sync."""
    monkeypatch.setattr(youtube_service, "get_channel_info", lambda: _channel_info())

    def _raise(_payload):
        raise OSError("disk full")

    monkeypatch.setattr("services.youtube_stats_store.save_channel_stats", _raise)
    monkeypatch.setattr(
        youtube_service,
        "fetch_latest_videos",
        lambda max_pages=5: [{"youtube_id": "abc123", "title": "Test Video"}],
    )

    with patch("services.supabase_service.upsert_videos") as mocked_upsert:
        mocked_upsert.return_value = [{"id": "row-1", "youtube_id": "abc123"}]
        result = youtube_service.sync_videos_from_youtube()

    assert result["synced"] == 1


# ---------------------------------------------------------------------------
# Routes: response shape unchanged by the sync_videos_from_youtube() extraction
# ---------------------------------------------------------------------------


def test_manual_sync_route_response_shape_unchanged():
    from app import create_app

    app = create_app()
    client = app.test_client()

    fake_actor = MagicMock(id="actor-1", role="editor")
    with patch(
        "routes.youtube_routes.require_editor", return_value=(fake_actor, None)
    ), patch(
        "routes.youtube_routes.youtube_service.sync_videos_from_youtube",
        return_value={
            "synced": 2,
            "items": [{"id": "1"}, {"id": "2"}],
            "channel": {"id": "UC1", "title": "Test Channel"},
        },
    ):
        response = client.post("/api/videos/sync")

    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["synced"] == 2
    assert body["data"]["channel"]["title"] == "Test Channel"
    assert "2件の動画を同期しました" in body["message"]


def test_manual_sync_route_empty_result_message():
    from app import create_app

    app = create_app()
    client = app.test_client()

    fake_actor = MagicMock(id="actor-1", role="editor")
    with patch(
        "routes.youtube_routes.require_editor", return_value=(fake_actor, None)
    ), patch(
        "routes.youtube_routes.youtube_service.sync_videos_from_youtube",
        return_value={"synced": 0, "items": [], "channel": {}},
    ):
        response = client.post("/api/admin/videos/sync")

    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["synced"] == 0
    assert "取得できる動画がありませんでした" in body["message"]
