from __future__ import annotations

from datetime import datetime, timedelta, timezone

from services.notification_banner_service import validate_banner_payload
from utils.publish_window import is_row_publicly_visible, is_within_publish_window
from utils.validators import ValidationError
import pytest

from services.announcement_service import validate_announcement_payload


def test_publish_window_unset_is_open():
    assert is_within_publish_window() is True


def test_publish_window_before_start():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    start = (now + timedelta(hours=1)).isoformat()
    assert (
        is_within_publish_window(publish_start_at=start, now=now) is False
    )


def test_publish_window_after_start():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    start = (now - timedelta(hours=1)).isoformat()
    assert is_within_publish_window(publish_start_at=start, now=now) is True


def test_publish_window_after_end_hides():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    end = (now - timedelta(seconds=1)).isoformat()
    assert is_within_publish_window(publish_end_at=end, now=now) is False


def test_publish_window_at_end_still_visible():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    end = now.isoformat()
    assert is_within_publish_window(publish_end_at=end, now=now) is True


def test_announcement_row_requires_published_and_window():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    row = {
        "is_published": True,
        "publish_start_at": (now - timedelta(days=1)).isoformat(),
        "publish_end_at": (now + timedelta(days=1)).isoformat(),
    }
    assert is_row_publicly_visible(row, now=now) is True

    row["is_published"] = False
    assert is_row_publicly_visible(row, now=now) is False


def test_validate_announcement_schedule_fields():
    data = validate_announcement_payload(
        {
            "title_ja": "予約",
            "publish_start_at": "2026-03-15T10:00:00+00:00",
            "publish_end_at": "2026-03-20T10:00:00+00:00",
        },
        partial=False,
    )
    assert data["publish_start_at"].startswith("2026-03-15")
    assert data["publish_end_at"].startswith("2026-03-20")


def test_validate_announcement_rejects_end_before_start():
    with pytest.raises(ValidationError):
        validate_announcement_payload(
            {
                "title_ja": "予約",
                "publish_start_at": "2026-03-20T10:00:00+00:00",
                "publish_end_at": "2026-03-15T10:00:00+00:00",
            },
            partial=False,
        )


def test_validate_banner_requires_title_ja():
    with pytest.raises(ValidationError):
        validate_banner_payload({"title_ja": " ", "message_ja": "x"})


def test_validate_banner_i18n_and_relative_link():
    data = validate_banner_payload(
        {
            "title_ja": "お知らせ",
            "title_en": "Notice",
            "message_ja": "新しい動画を公開しました",
            "message_en": "New video published",
            "link_url": "/videos",
            "is_active": True,
        },
        partial=False,
    )
    assert data["title_ja"] == "お知らせ"
    assert data["title_en"] == "Notice"
    assert data["link_url"] == "/videos"
    assert data["is_active"] is True


def test_validate_banner_schedule_end_before_start():
    with pytest.raises(ValidationError):
        validate_banner_payload(
            {
                "title_ja": "Banner",
                "publish_start_at": "2026-04-01T00:00:00+00:00",
                "publish_end_at": "2026-03-01T00:00:00+00:00",
            },
            partial=False,
        )


def test_banner_row_visibility():
    now = datetime(2026, 3, 15, 12, 0, tzinfo=timezone.utc)
    row = {
        "is_active": True,
        "publish_start_at": None,
        "publish_end_at": (now - timedelta(hours=1)).isoformat(),
    }
    assert is_row_publicly_visible(row, active_key="is_active", now=now) is False
