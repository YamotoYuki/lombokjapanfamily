from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from services.ga4_service import (
    Ga4ConfigError,
    fetch_ga4_bundle,
    normalize_ga_date,
)
from services.supabase_service import get_supabase_client
from utils.validators import ValidationError


def _parse_date(value: str | None, fallback: date) -> date:
    if not value:
        return fallback
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError("期間を正しく指定してください") from exc


def resolve_range(
    start_date: str | None,
    end_date: str | None,
    *,
    days: int = 30,
) -> tuple[str, str]:
    today = datetime.now(timezone.utc).date()
    end = _parse_date(end_date, today)
    start = _parse_date(start_date, end - timedelta(days=days - 1))
    if start > end:
        raise ValidationError("期間を正しく指定してください")
    return start.isoformat(), end.isoformat()


def get_summary(start_date: str | None, end_date: str | None) -> dict[str, Any]:
    start, end = resolve_range(start_date, end_date)
    client = get_supabase_client()
    rows = (
        client.table("analytics_cache")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .execute()
        .data
        or []
    )

    if not rows:
        return {
            "total_pv": 0,
            "total_uu": 0,
            "total_sessions": 0,
            "avg_session_duration": 0,
            "bounce_rate": 0,
            "event_count": 0,
            "start_date": start,
            "end_date": end,
            "empty": True,
        }

    total_pv = sum(int(row.get("pv") or 0) for row in rows)
    total_uu = sum(int(row.get("uu") or 0) for row in rows)
    total_sessions = sum(int(row.get("sessions") or 0) for row in rows)
    event_count = sum(int(row.get("event_count") or 0) for row in rows)

    # Weighted averages by sessions when possible
    duration_weight = 0.0
    bounce_weight = 0.0
    session_weight = 0
    for row in rows:
        sessions = int(row.get("sessions") or 0)
        weight = sessions if sessions > 0 else 1
        duration_weight += (
            float(row.get("avg_session_duration") or row.get("avg_session") or 0) * weight
        )
        bounce_weight += float(row.get("bounce_rate") or 0) * weight
        session_weight += weight

    return {
        "total_pv": total_pv,
        "total_uu": total_uu,
        "total_sessions": total_sessions,
        "avg_session_duration": round(duration_weight / session_weight, 2) if session_weight else 0,
        "bounce_rate": round(bounce_weight / session_weight, 2) if session_weight else 0,
        "event_count": event_count,
        "start_date": start,
        "end_date": end,
        "empty": False,
    }


def get_timeseries(start_date: str | None, end_date: str | None) -> list[dict[str, Any]]:
    start, end = resolve_range(start_date, end_date)
    client = get_supabase_client()
    rows = (
        client.table("analytics_cache")
        .select("date,pv,uu,sessions")
        .gte("date", start)
        .lte("date", end)
        .order("date", desc=False)
        .execute()
        .data
        or []
    )
    return [
        {
            "date": row.get("date"),
            "pv": int(row.get("pv") or 0),
            "uu": int(row.get("uu") or 0),
            "sessions": int(row.get("sessions") or 0),
        }
        for row in rows
    ]


def get_pages(
    start_date: str | None,
    end_date: str | None,
    *,
    limit: int = 10,
) -> list[dict[str, Any]]:
    start, end = resolve_range(start_date, end_date)
    limit = min(max(limit, 1), 100)
    client = get_supabase_client()
    rows = (
        client.table("analytics_pages")
        .select("page_path,page_title,pv,active_users")
        .gte("date", start)
        .lte("date", end)
        .execute()
        .data
        or []
    )

    aggregated: dict[str, dict[str, Any]] = {}
    for row in rows:
        path = row.get("page_path") or "/"
        bucket = aggregated.setdefault(
            path,
            {
                "page_path": path,
                "page_title": row.get("page_title") or path,
                "pv": 0,
                "active_users": 0,
            },
        )
        bucket["pv"] += int(row.get("pv") or 0)
        bucket["active_users"] += int(row.get("active_users") or 0)
        if row.get("page_title"):
            bucket["page_title"] = row.get("page_title")

    items = sorted(aggregated.values(), key=lambda item: item["pv"], reverse=True)
    return items[:limit]


def get_countries(start_date: str | None, end_date: str | None) -> list[dict[str, Any]]:
    start, end = resolve_range(start_date, end_date)
    client = get_supabase_client()
    rows = (
        client.table("analytics_countries")
        .select("country,active_users,sessions")
        .gte("date", start)
        .lte("date", end)
        .execute()
        .data
        or []
    )
    aggregated: dict[str, dict[str, Any]] = {}
    for row in rows:
        country = row.get("country") or "Unknown"
        bucket = aggregated.setdefault(
            country,
            {"country": country, "active_users": 0, "sessions": 0},
        )
        bucket["active_users"] += int(row.get("active_users") or 0)
        bucket["sessions"] += int(row.get("sessions") or 0)
    return sorted(
        aggregated.values(),
        key=lambda item: item["active_users"],
        reverse=True,
    )


def get_devices(start_date: str | None, end_date: str | None) -> list[dict[str, Any]]:
    start, end = resolve_range(start_date, end_date)
    client = get_supabase_client()
    rows = (
        client.table("analytics_devices")
        .select("device_category,active_users,sessions")
        .gte("date", start)
        .lte("date", end)
        .execute()
        .data
        or []
    )
    aggregated: dict[str, dict[str, Any]] = {}
    for row in rows:
        device = (row.get("device_category") or "unknown").lower()
        bucket = aggregated.setdefault(
            device,
            {"device_category": device, "active_users": 0, "sessions": 0},
        )
        bucket["active_users"] += int(row.get("active_users") or 0)
        bucket["sessions"] += int(row.get("sessions") or 0)
    return sorted(
        aggregated.values(),
        key=lambda item: item["active_users"],
        reverse=True,
    )


def get_sources(start_date: str | None, end_date: str | None) -> list[dict[str, Any]]:
    start, end = resolve_range(start_date, end_date)
    client = get_supabase_client()
    rows = (
        client.table("analytics_sources")
        .select("source,medium,sessions,active_users")
        .gte("date", start)
        .lte("date", end)
        .execute()
        .data
        or []
    )
    aggregated: dict[str, dict[str, Any]] = {}
    for row in rows:
        source = row.get("source") or "(direct)"
        medium = row.get("medium") or "(none)"
        key = f"{source}::{medium}"
        bucket = aggregated.setdefault(
            key,
            {
                "source": source,
                "medium": medium,
                "sessions": 0,
                "active_users": 0,
            },
        )
        bucket["sessions"] += int(row.get("sessions") or 0)
        bucket["active_users"] += int(row.get("active_users") or 0)
    return sorted(
        aggregated.values(),
        key=lambda item: item["sessions"],
        reverse=True,
    )


def sync_from_ga4(
    *,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    bundle = fetch_ga4_bundle(start_date=start_date, end_date=end_date)
    client = get_supabase_client()

    cache_rows = []
    for row in bundle["daily"]:
        day = normalize_ga_date(str(row.get("date") or ""))
        if not day:
            continue
        cache_rows.append(
            {
                "date": day,
                "pv": int(row.get("screenPageViews") or 0),
                "uu": int(row.get("activeUsers") or 0),
                "sessions": int(row.get("sessions") or 0),
                "avg_session_duration": float(row.get("averageSessionDuration") or 0),
                "bounce_rate": float(row.get("bounceRate") or 0) * 100,
                "event_count": int(row.get("eventCount") or 0),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    if cache_rows:
        client.table("analytics_cache").upsert(
            cache_rows,
            on_conflict="date",
        ).execute()

    page_rows = []
    for row in bundle["pages"]:
        day = normalize_ga_date(str(row.get("date") or ""))
        path = row.get("pagePath") or "/"
        if not day:
            continue
        page_rows.append(
            {
                "date": day,
                "page_path": path,
                "page_title": row.get("pageTitle") or path,
                "pv": int(row.get("screenPageViews") or 0),
                "active_users": int(row.get("activeUsers") or 0),
            }
        )
    if page_rows:
        # Replace overlapping dates then upsert
        dates = sorted({item["date"] for item in page_rows})
        client.table("analytics_pages").delete().in_("date", dates).execute()
        # chunk inserts
        for index in range(0, len(page_rows), 500):
            client.table("analytics_pages").insert(page_rows[index : index + 500]).execute()

    country_rows = []
    for row in bundle["countries"]:
        day = normalize_ga_date(str(row.get("date") or ""))
        if not day:
            continue
        country_rows.append(
            {
                "date": day,
                "country": row.get("country") or "Unknown",
                "active_users": int(row.get("activeUsers") or 0),
                "sessions": int(row.get("sessions") or 0),
            }
        )
    if country_rows:
        dates = sorted({item["date"] for item in country_rows})
        client.table("analytics_countries").delete().in_("date", dates).execute()
        for index in range(0, len(country_rows), 500):
            client.table("analytics_countries").insert(country_rows[index : index + 500]).execute()

    device_rows = []
    for row in bundle["devices"]:
        day = normalize_ga_date(str(row.get("date") or ""))
        if not day:
            continue
        device_rows.append(
            {
                "date": day,
                "device_category": (row.get("deviceCategory") or "unknown").lower(),
                "active_users": int(row.get("activeUsers") or 0),
                "sessions": int(row.get("sessions") or 0),
            }
        )
    if device_rows:
        dates = sorted({item["date"] for item in device_rows})
        client.table("analytics_devices").delete().in_("date", dates).execute()
        client.table("analytics_devices").insert(device_rows).execute()

    source_rows = []
    for row in bundle["sources"]:
        day = normalize_ga_date(str(row.get("date") or ""))
        if not day:
            continue
        source_rows.append(
            {
                "date": day,
                "source": row.get("sessionSource") or "(direct)",
                "medium": row.get("sessionMedium") or "(none)",
                "sessions": int(row.get("sessions") or 0),
                "active_users": int(row.get("activeUsers") or 0),
            }
        )
    if source_rows:
        dates = sorted({item["date"] for item in source_rows})
        client.table("analytics_sources").delete().in_("date", dates).execute()
        for index in range(0, len(source_rows), 500):
            client.table("analytics_sources").insert(source_rows[index : index + 500]).execute()

    return {
        "start_date": bundle["start_date"],
        "end_date": bundle["end_date"],
        "cache_rows": len(cache_rows),
        "pages_rows": len(page_rows),
        "countries_rows": len(country_rows),
        "devices_rows": len(device_rows),
        "sources_rows": len(source_rows),
    }


# Re-export for routes
__all__ = [
    "Ga4ConfigError",
    "get_summary",
    "get_timeseries",
    "get_pages",
    "get_countries",
    "get_devices",
    "get_sources",
    "sync_from_ga4",
]
