from __future__ import annotations

from flask import Blueprint, request

from services import gallery_service
from services.gallery_service import GalleryConflictError, GalleryNotFoundError
from services.storage_service import read_upload_file
from services.supabase_service import SupabaseConfigError
from utils.auth import is_staff_request, require_editor, require_staff
from utils.response import error, success
from utils.validators import ValidationError, parse_positive_int

gallery_bp = Blueprint("gallery", __name__)


@gallery_bp.get("/api/gallery/stats")
def gallery_stats():
    _, err = require_staff()
    if err:
        return err
    try:
        return success(gallery_service.get_gallery_stats())
    except Exception as exc:
        return error("写真の取得に失敗しました", status=500, details=str(exc))


@gallery_bp.post("/api/gallery/upload")
def upload_gallery_image():
    _, err = require_editor()
    if err:
        return err
    try:
        file_storage = request.files.get("image") or request.files.get("file")
        file_bytes, filename, content_type = read_upload_file(file_storage)
        category_slug = request.form.get("category_slug") or request.args.get(
            "category_slug"
        )
        uploaded = gallery_service.upload_gallery_image(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            category_slug=category_slug,
        )
        return success(uploaded, message="写真を保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "画像のアップロードに失敗しました",
            status=500,
            details=str(exc),
        )


@gallery_bp.get("/api/gallery")
def list_gallery():
    try:
        staff = is_staff_request()
        visible_only = str(request.args.get("visible_only") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if not staff:
            visible_only = True
        featured = gallery_service.parse_featured_query(request.args.get("featured"))
        data = gallery_service.list_gallery(
            keyword=request.args.get("keyword"),
            category=request.args.get("category"),
            featured=featured,
            visible_only=visible_only,
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"), default=24, maximum=100, label="limit"
            ),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("写真の取得に失敗しました", status=500, details=str(exc))


@gallery_bp.get("/api/gallery/<item_id>")
def get_gallery_item(item_id: str):
    try:
        item = gallery_service.get_gallery_item(item_id)
        if not is_staff_request() and not item.get("is_visible", True):
            raise GalleryNotFoundError("写真が見つかりません")
        return success(item)
    except GalleryNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("写真の取得に失敗しました", status=500, details=str(exc))


@gallery_bp.post("/api/gallery")
def create_gallery_item():
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = gallery_service.create_gallery_item(payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="GALLERY_CREATED",
                target_type="gallery",
                target_id=str(item.get("id") or ""),
            )
        except Exception:
            pass
        return success(item, message="写真を保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("写真の保存に失敗しました", status=500, details=str(exc))


@gallery_bp.patch("/api/gallery/<item_id>")
def update_gallery_item(item_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        item = gallery_service.update_gallery_item(item_id, payload)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="GALLERY_UPDATED",
                target_type="gallery",
                target_id=item_id,
            )
        except Exception:
            pass
        return success(item, message="写真を保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except GalleryNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("写真の保存に失敗しました", status=500, details=str(exc))


@gallery_bp.delete("/api/gallery/<item_id>")
def delete_gallery_item(item_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        hard = str(request.args.get("hard") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if hard:
            item = gallery_service.hard_delete_gallery_item(item_id)
            message = "写真を削除しました"
            action = "GALLERY_HARD_DELETED"
        else:
            item = gallery_service.soft_delete_gallery_item(item_id)
            message = "写真を非表示にしました"
            action = "GALLERY_DELETED"
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action=action,
                target_type="gallery",
                target_id=item_id,
            )
        except Exception:
            pass
        return success(item, message=message)
    except GalleryNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("写真の削除に失敗しました", status=500, details=str(exc))


@gallery_bp.get("/api/gallery-categories")
def list_categories():
    try:
        return success({"items": gallery_service.list_gallery_categories()})
    except Exception as exc:
        return error("カテゴリーの取得に失敗しました", status=500, details=str(exc))


@gallery_bp.post("/api/gallery-categories")
def create_category():
    _, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        category = gallery_service.create_gallery_category(payload)
        return success(category, message="カテゴリーを保存しました", status=201)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except GalleryConflictError as exc:
        return error(str(exc), status=409)
    except Exception as exc:
        return error("カテゴリーの保存に失敗しました", status=500, details=str(exc))


@gallery_bp.patch("/api/gallery-categories/<category_id>")
def update_category(category_id: str):
    _, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        category = gallery_service.update_gallery_category(category_id, payload)
        return success(category, message="カテゴリーを保存しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except GalleryConflictError as exc:
        return error(str(exc), status=409)
    except GalleryNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("カテゴリーの保存に失敗しました", status=500, details=str(exc))


@gallery_bp.delete("/api/gallery-categories/<category_id>")
def delete_category(category_id: str):
    _, err = require_editor()
    if err:
        return err
    try:
        gallery_service.delete_gallery_category(category_id)
        return success({"id": category_id}, message="カテゴリーを削除しました")
    except GalleryConflictError as exc:
        return error(str(exc), status=409)
    except GalleryNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("カテゴリーの保存に失敗しました", status=500, details=str(exc))
