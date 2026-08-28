from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from typing import Any

from utils.validators import ValidationError


class Ga4ConfigError(RuntimeError):
    pass


def _require_config() -> tuple[str, str]:
    property_id = os.getenv("GA4_PROPERTY_ID", "").strip()
    credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()

    if not property_id:
        raise Ga4ConfigError("GA4_PROPERTY_IDが設定されていません")
    if not credentials:
        raise Ga4ConfigError("Google認証情報が設定されていません")
    if not os.path.exists(credentials):
        raise Ga4ConfigError("Google認証情報が設定されていません")

    return property_id, credentials


def _parse_date(value: str | None, fallback: date) -> date:
    if not value:
        return fallback
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError("期間を正しく指定してください") from exc


def default_date_range(
    start_date: str | None = None,
    end_date: str | None = None,
    *,
    days: int = 30,
) -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    end = _parse_date(end_date, today)
    start = _parse_date(start_date, end - timedelta(days=days - 1))
    if start > end:
        raise ValidationError("期間を正しく指定してください")
    return start, end


def _metric_map(row_values: list[Any], names: list[str]) -> dict[str, float]:
    result: dict[str, float] = {}
    for index, name in enumerate(names):
        raw = row_values[index].value if index < len(row_values) else "0"
        try:
            result[name] = float(raw or 0)
        except (TypeError, ValueError):
            result[name] = 0.0
    return result


def _run_report(
    *,
    property_id: str,
    start: date,
    end: date,
    dimensions: list[str],
    metrics: list[str],
    limit: int | None = None,
) -> list[dict[str, Any]]:
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import (
            DateRange,
            Dimension,
            Metric,
            RunReportRequest,
        )
    except ImportError as exc:
        raise Ga4ConfigError("google-analytics-data がインストールされていません") from exc

    client = BetaAnalyticsDataClient()
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name=name) for name in dimensions],
        metrics=[Metric(name=name) for name in metrics],
        date_ranges=[DateRange(start_date=start.isoformat(), end_date=end.isoformat())],
        limit=limit or 100000,
    )
    response = client.run_report(request)

    rows: list[dict[str, Any]] = []
    for row in response.rows:
        item: dict[str, Any] = {}
        for index, dim in enumerate(dimensions):
            item[dim] = (
                row.dimension_values[index].value if index < len(row.dimension_values) else ""
            )
        metrics_values = _metric_map(list(row.metric_values), metrics)
        item.update(metrics_values)
        rows.append(item)
    return rows


def fetch_ga4_bundle(
    *,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    Fetch GA4 reports for caching.

    TODO: Google Search Console連携
    TODO: 検索キーワード詳細分析
    TODO: 記事別CV分析 / お問い合わせCV率分析
    TODO: YouTube動画との相関分析
    TODO: AIによるアクセス改善提案
    TODO: 自動レポートPDF出力 / 週次メールレポート
    """
    property_id, _credentials = _require_config()
    # GOOGLE_APPLICATION_CREDENTIALS is read by google-auth automatically
    start, end = default_date_range(start_date, end_date, days=30)

    daily = _run_report(
        property_id=property_id,
        start=start,
        end=end,
        dimensions=["date"],
        metrics=[
            "screenPageViews",
            "activeUsers",
            "sessions",
            "averageSessionDuration",
            "bounceRate",
            "eventCount",
        ],
    )

    pages = _run_report(
        property_id=property_id,
        start=start,
        end=end,
        dimensions=["date", "pagePath", "pageTitle"],
        metrics=["screenPageViews", "activeUsers"],
        limit=5000,
    )

    countries = _run_report(
        property_id=property_id,
        start=start,
        end=end,
        dimensions=["date", "country"],
        metrics=["activeUsers", "sessions"],
        limit=2000,
    )

    devices = _run_report(
        property_id=property_id,
        start=start,
        end=end,
        dimensions=["date", "deviceCategory"],
        metrics=["activeUsers", "sessions"],
        limit=500,
    )

    sources = _run_report(
        property_id=property_id,
        start=start,
        end=end,
        dimensions=["date", "sessionSource", "sessionMedium"],
        metrics=["sessions", "activeUsers"],
        limit=3000,
    )

    return {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": daily,
        "pages": pages,
        "countries": countries,
        "devices": devices,
        "sources": sources,
    }


def normalize_ga_date(value: str) -> str:
    """GA4 returns YYYYMMDD for date dimension."""
    text = (value or "").strip()
    if len(text) == 8 and text.isdigit():
        return f"{text[0:4]}-{text[4:6]}-{text[6:8]}"
    return text
