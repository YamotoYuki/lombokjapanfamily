from __future__ import annotations

from utils.popular_videos import select_popular_videos


def test_select_featured_first():
    items = [
        {
            "id": "1",
            "is_visible": True,
            "is_featured": False,
            "views": 9999,
            "published_at": "2026-01-01",
        },
        {
            "id": "2",
            "is_visible": True,
            "is_featured": True,
            "views": 10,
            "published_at": "2026-02-01",
        },
        {
            "id": "3",
            "is_visible": True,
            "is_featured": True,
            "views": 50,
            "published_at": "2026-03-01",
        },
    ]
    selected = select_popular_videos(items, limit=6)
    assert [row["id"] for row in selected] == ["3", "2"]


def test_select_views_when_no_featured():
    items = [
        {
            "id": "a",
            "is_visible": True,
            "is_featured": False,
            "views": 100,
            "published_at": "2026-01-01",
        },
        {
            "id": "b",
            "is_visible": True,
            "is_featured": False,
            "views": 500,
            "published_at": "2026-02-01",
        },
    ]
    selected = select_popular_videos(items, limit=1)
    assert selected[0]["id"] == "b"


def test_select_latest_when_no_views():
    items = [
        {
            "id": "old",
            "is_visible": True,
            "is_featured": False,
            "views": 0,
            "published_at": "2025-01-01",
        },
        {
            "id": "new",
            "is_visible": True,
            "is_featured": False,
            "views": 0,
            "published_at": "2026-08-01",
        },
    ]
    selected = select_popular_videos(items, limit=1)
    assert selected[0]["id"] == "new"


def test_select_respects_limit_and_hides_invisible():
    items = [
        {
            "id": str(i),
            "is_visible": i != 0,
            "is_featured": True,
            "views": i,
            "published_at": f"2026-01-{i+1:02d}",
        }
        for i in range(8)
    ]
    selected = select_popular_videos(items, limit=6)
    assert len(selected) == 6
    assert "0" not in [row["id"] for row in selected]
