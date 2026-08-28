from __future__ import annotations

from flask import Blueprint, request

from services import analytics_service
from services.audit_service import write_audit_log
from services.ga4_service import Ga4ConfigError
from services.supabase_service import SupabaseConfigError
from utils.auth import require_admin, require_staff
from utils.response import error, success
from utils.validators import ValidationError

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/api/analytics/summary")
def analytics_summary():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_summary(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.get("/api/analytics/timeseries")
def analytics_timeseries():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_timeseries(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
        return success({"items": data})
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.get("/api/analytics/pages")
def analytics_pages():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_pages(
            request.args.get("start_date"),
            request.args.get("end_date"),
            limit=int(request.args.get("limit") or 10),
        )
        return success({"items": data})
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.get("/api/analytics/countries")
def analytics_countries():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_countries(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
        return success({"items": data})
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.get("/api/analytics/devices")
def analytics_devices():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_devices(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
        return success({"items": data})
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.get("/api/analytics/sources")
def analytics_sources():
    _, err = require_staff()
    if err:
        return err
    try:
        data = analytics_service.get_sources(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
        return success({"items": data})
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "アクセス解析データの取得に失敗しました",
            status=500,
            details=str(exc),
        )


@analytics_bp.post("/api/analytics/sync")
def analytics_sync():
    actor, err = require_admin()
    if err:
        return err
    try:
        body = request.get_json(silent=True) or {}
        result = analytics_service.sync_from_ga4(
            start_date=body.get("start_date") or request.args.get("start_date"),
            end_date=body.get("end_date") or request.args.get("end_date"),
        )
        write_audit_log(
            user_id=actor.id if actor else None,
            action="ANALYTICS_SYNCED",
            target_type="analytics",
            target_id=None,
            meta=result,
        )
        return success(result, message="Google Analyticsと同期しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Ga4ConfigError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "Google Analyticsとの同期に失敗しました",
            status=500,
            details=str(exc),
        )
