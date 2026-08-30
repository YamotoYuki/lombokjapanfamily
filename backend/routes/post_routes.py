from __future__ import annotations

from flask import Blueprint, request

from services import post_service
from services.post_service import (
    PostConflictError,
    PostNotFoundError,
    PostValidationError,
)
from services.supabase_service import SupabaseConfigError
from utils.auth import require_editor
from utils.response import error, success
from utils.validators import ValidationError, parse_positive_int

posts_bp = Blueprint("posts", __name__)


def _gate_editor():
    actor, err = require_editor()
    if actor:
        request.auth_user = actor  # type: ignore[attr-defined]
    return actor, err


@posts_bp.get("/api/posts")
def get_posts():
    actor, err = _gate_editor()
    if err:
        return err
    try:
        data = post_service.list_posts(
            keyword=request.args.get("keyword"),
            category=request.args.get("category"),
            tag=request.args.get("tag"),
            status=request.args.get("status"),
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"), default=20, maximum=100, label="limit"
            ),
            public_only=False,
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事取得に失敗しました", status=500, details=str(exc))


@posts_bp.get("/api/posts/public")
def get_public_posts():
    try:
        data = post_service.list_posts(
            keyword=request.args.get("keyword"),
            category=request.args.get("category"),
            tag=request.args.get("tag"),
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"), default=12, maximum=100, label="limit"
            ),
            public_only=True,
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事取得に失敗しました", status=500, details=str(exc))


@posts_bp.get("/api/posts/slug/<slug>")
def get_post_by_slug(slug: str):
    try:
        post = post_service.get_public_post_by_slug(slug)
        related = post_service.list_posts(
            category=post.get("category_id"),
            page=1,
            limit=4,
            public_only=True,
        )
        related_items = [
            item for item in related["items"] if item and item.get("id") != post["id"]
        ][:3]
        return success({"post": post, "related": related_items})
    except PostNotFoundError as exc:
        return error(str(exc), status=404)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事取得に失敗しました", status=500, details=str(exc))


@posts_bp.get("/api/posts/<post_id>")
def get_post(post_id: str):
    actor, err = _gate_editor()
    if err:
        return err
    try:
        post = post_service.get_post_by_id(post_id)
        return success(post)
    except PostNotFoundError as exc:
        return error(str(exc), status=404)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事取得に失敗しました", status=500, details=str(exc))


@posts_bp.post("/api/posts")
def create_post():
    actor, err = _gate_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    try:
        post = post_service.create_post(payload, user_id=actor.id if actor else None)
        message = {
            "draft": "記事を下書き保存しました",
            "published": "記事を公開しました",
            "scheduled": "記事を公開予約しました",
        }.get(post.get("status"), "記事を保存しました")
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="POST_CREATED",
                target_type="posts",
                target_id=str(post.get("id") or ""),
            )
        except Exception:
            pass
        return success(post, message=message, status=201)
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except PostConflictError as exc:
        return error(str(exc), status=409)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事の保存に失敗しました", status=500, details=str(exc))


@posts_bp.patch("/api/posts/<post_id>")
def patch_post(post_id: str):
    actor, err = _gate_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    try:
        post = post_service.update_post(
            post_id,
            payload,
            user_id=actor.id if actor else None,
        )
        message = {
            "draft": "記事を下書き保存しました",
            "published": "記事を公開しました",
            "scheduled": "記事を公開予約しました",
            "archived": "記事を削除しました",
        }.get(post.get("status"), "記事を保存しました")
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="POST_UPDATED",
                target_type="posts",
                target_id=post_id,
            )
        except Exception:
            pass
        return success(post, message=message)
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except PostConflictError as exc:
        return error(str(exc), status=409)
    except PostNotFoundError as exc:
        return error(str(exc), status=404)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事の保存に失敗しました", status=500, details=str(exc))


@posts_bp.delete("/api/posts/<post_id>")
def delete_post(post_id: str):
    actor, err = _gate_editor()
    if err:
        return err

    try:
        post = post_service.archive_post(post_id, user_id=actor.id if actor else None)
        try:
            from services.audit_service import write_audit_log

            write_audit_log(
                user_id=actor.id if actor else None,
                action="POST_DELETED",
                target_type="posts",
                target_id=post_id,
            )
        except Exception:
            pass
        return success(post, message="記事を削除しました")
    except PostNotFoundError as exc:
        return error(str(exc), status=404)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("記事の保存に失敗しました", status=500, details=str(exc))


@posts_bp.post("/api/posts/upload-image")
def upload_image():
    _, err = _gate_editor()
    if err:
        return err

    file = request.files.get("file")
    if not file:
        return error("画像ファイルを選択してください。", status=400)

    folder = request.form.get("folder") or "featured"
    try:
        uploaded = post_service.upload_post_image(
            file_bytes=file.read(),
            filename=file.filename or "image.jpg",
            content_type=file.mimetype or "application/octet-stream",
            folder=folder,
        )
        return success(uploaded, message="画像をアップロードしました")
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("画像アップロードに失敗しました", status=500, details=str(exc))


@posts_bp.get("/api/post-categories")
def get_categories():
    try:
        return success({"items": post_service.list_categories()})
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error("カテゴリーの取得に失敗しました", status=500, details=str(exc))


@posts_bp.post("/api/post-categories")
def create_category():
    _, err = _gate_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    try:
        category = post_service.create_category(payload)
        return success(category, message="カテゴリーを作成しました", status=201)
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except PostConflictError as exc:
        return error(str(exc), status=409)
    except Exception as exc:
        return error("カテゴリーの取得に失敗しました", status=500, details=str(exc))


@posts_bp.patch("/api/post-categories/<category_id>")
def patch_category(category_id: str):
    _, err = _gate_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    try:
        category = post_service.update_category(category_id, payload)
        return success(category, message="カテゴリーを更新しました")
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except PostConflictError as exc:
        return error(str(exc), status=409)
    except PostNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("カテゴリーの取得に失敗しました", status=500, details=str(exc))


@posts_bp.delete("/api/post-categories/<category_id>")
def remove_category(category_id: str):
    _, err = _gate_editor()
    if err:
        return err

    try:
        post_service.delete_category(category_id)
        return success({"id": category_id}, message="カテゴリーを削除しました")
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("カテゴリーの取得に失敗しました", status=500, details=str(exc))


@posts_bp.get("/api/post-tags")
def get_tags():
    try:
        return success({"items": post_service.list_tags()})
    except Exception as exc:
        return error("通信エラーが発生しました", status=500, details=str(exc))


@posts_bp.post("/api/post-tags")
def create_tag():
    _, err = _gate_editor()
    if err:
        return err

    payload = request.get_json(silent=True) or {}
    try:
        tag = post_service.create_tag(payload)
        return success(tag, message="タグを作成しました", status=201)
    except PostValidationError as exc:
        return error(str(exc), status=400)
    except PostConflictError as exc:
        return error(str(exc), status=409)
    except Exception as exc:
        return error("通信エラーが発生しました", status=500, details=str(exc))
