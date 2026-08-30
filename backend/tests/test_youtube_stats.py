from __future__ import annotations

import json
from pathlib import Path

from services import youtube_stats_store


def test_save_and_load_channel_stats(tmp_path: Path, monkeypatch):
    stats_path = tmp_path / "youtube_channel_stats.json"
    monkeypatch.setattr(youtube_stats_store, "DATA_DIR", tmp_path)
    monkeypatch.setattr(youtube_stats_store, "STATS_PATH", stats_path)

    saved = youtube_stats_store.save_channel_stats(
        {
            "subscriber_count": 313000,
            "video_count": 775,
            "view_count": 123456789,
            "id": "UCtest",
            "title": "Lombok-Japan Family",
        }
    )
    assert saved["subscriber_count"] == 313000
    assert saved["total_view_count"] == 123456789
    assert saved["synced_at"]

    loaded = youtube_stats_store.load_channel_stats()
    assert loaded is not None
    assert loaded["video_count"] == 775
    assert loaded["channel_id"] == "UCtest"

    raw = json.loads(stats_path.read_text(encoding="utf-8"))
    assert "subscriber_count" in raw


def test_stats_stale_without_synced_at():
    assert youtube_stats_store.is_stats_stale(None) is True
    assert youtube_stats_store.is_stats_stale({"synced_at": None}) is True


def test_channel_stats_endpoint_available(monkeypatch):
    monkeypatch.setattr(
        "services.youtube_service.maybe_refresh_stale_channel_stats",
        lambda **_kwargs: None,
    )
    monkeypatch.setattr(
        "services.youtube_stats_store.load_channel_stats",
        lambda: {
            "subscriber_count": 313000,
            "video_count": 775,
            "total_view_count": 12000000,
            "synced_at": "2026-08-30T00:00:00+00:00",
        },
    )
    from app import create_app

    client = create_app().test_client()
    response = client.get("/api/videos/channel-stats")
    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["available"] is True
    assert body["data"]["subscriber_count"] == 313000
