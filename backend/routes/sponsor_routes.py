from __future__ import annotations

from flask import Blueprint, request

from services import sponsor_service
from services.audit_service import write_audit_log
from services.sponsor_service import SponsorNotFoundError
from services.supabase_service import SupabaseConfigError
from utils.auth import require_editor, require_staff
from utils.response import error, success
from utils.validators import ValidationError, parse_positive_int

sponsors_bp = Blueprint("sponsors", __name__)


@sponsors_bp.get("/api/sponsors/stats")
def sponsor_stats():
    _, err = require_staff()
    if err:
        return err
    try:
        return success(sponsor_service.get_sponsor_stats())
    except Exception as exc:
        return error("案件の取得に失敗しました", status=500, details=str(exc))


@sponsors_bp.post("/api/sponsors/upload")
def upload_sponsor_file():
    _, err = require_editor()
    if err:
        return err
    try:
        file_storage = request.files.get("file") or request.files.get("attachment")
        if file_storage is None or not file_storage.filename:
            return error("添付ファイルを選択してください", status=400)
        file_bytes = file_storage.read()
        uploaded = sponsor_service.upload_sponsor_file(
            file_bytes=file_bytes,
            filename=str(file_storage.filename),
            content_type=str(file_storage.content_type or ""),
        )
        return success(uploaded, message="案件を保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "添付ファイルのアップロードに失敗しました",
            status=500,
            details=str(exc),
        )


@sponsors_bp.get("/api/sponsors")
def list_sponsors():
    _, err = require_staff()
    if err:
        return err
    try:
        data = sponsor_service.list_sponsors(
            keyword=request.args.get("keyword"),
            status=request.args.get("status"),
            project_type=request.args.get("type") or request.args.get("project_type"),
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"), default=20, maximum=100, label="limit"
            ),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("案件の取得に失敗しました", status=500, details=str(exc))


@sponsors_bp.get("/api/sponsors/<sponsor_id>")
def get_sponsor(sponsor_id: str):
    _, err = require_staff()
    if err:
        return err
    try:
        return success(sponsor_service.get_sponsor(sponsor_id))
    except SponsorNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("案件の取得に失敗しました", status=500, details=str(exc))


@sponsors_bp.post("/api/sponsors")
def create_sponsor():
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        sponsor = sponsor_service.create_sponsor(payload)
        write_audit_log(
            user_id=actor.id if actor else None,
            action="SPONSOR_CREATED",
            target_type="sponsor",
            target_id=sponsor.get("id"),
        )
        return success(sponsor, message="案件を保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("案件の保存に失敗しました", status=500, details=str(exc))


@sponsors_bp.patch("/api/sponsors/<sponsor_id>")
def update_sponsor(sponsor_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        sponsor = sponsor_service.update_sponsor(sponsor_id, payload)
        write_audit_log(
            user_id=actor.id if actor else None,
            action="SPONSOR_UPDATED",
            target_type="sponsor",
            target_id=sponsor_id,
        )
        return success(sponsor, message="案件を更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SponsorNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("案件の保存に失敗しました", status=500, details=str(exc))


@sponsors_bp.delete("/api/sponsors/<sponsor_id>")
def delete_sponsor(sponsor_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        sponsor = sponsor_service.soft_delete_sponsor(sponsor_id)
        write_audit_log(
            user_id=actor.id if actor else None,
            action="SPONSOR_DELETED",
            target_type="sponsor",
            target_id=sponsor_id,
        )
        return success(sponsor, message="案件を削除しました")
    except SponsorNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("案件の保存に失敗しました", status=500, details=str(exc))
