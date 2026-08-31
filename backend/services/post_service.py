from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from services.supabase_service import SupabaseConfigError, get_supabase_client

logger = logging.getLogger(__name__)

ALLOWED_POST_STATUSES = {"draft", "scheduled", "published", "archived"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

POST_SELECT = (
    "*, "
    "category:post_categories(*), "
    "tag_relations:post_tag_relations(id, tag:post_tags(*))"
)

POST_I18N_FIELDS = (
    "title_ja",
    "title_en",
    "title_id",
    "content_ja",
    "content_en",
    "content_id",
    "excerpt_ja",
    "excerpt_en",
    "excerpt_id",
)

# Fallback when posts.*_en / *_id columns are not migrated yet.
_I18N_MARKER_OPEN = "<!--LJF_I18N:"
_I18N_MARKER_CLOSE = "-->"


class PostValidationError(ValueError):
    pass


class PostConflictError(ValueError):
    pass


class PostNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify_label(value: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    if base:
        return base[:80]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"item-{stamp}"


def normalize_post(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None

    tags: list[dict[str, Any]] = []
    for relation in row.get("tag_relations") or []:
        tag = relation.get("tag")
        if tag:
            tags.append(tag)

    normalized = {**row}
    normalized.pop("tag_relations", None)
    normalized["tags"] = tags

    body, bag = _extract_i18n_trailer(str(normalized.get("content") or ""))
    normalized["content"] = body
    content_ja = normalized.get("content_ja")
    if content_ja is None or str(content_ja).strip() == "":
        normalized["content_ja"] = body
    else:
        ja_body, _ = _extract_i18n_trailer(str(content_ja))
        normalized["content_ja"] = ja_body

    if not (normalized.get("title_ja") or "").strip():
        normalized["title_ja"] = normalized.get("title")
    if normalized.get("excerpt_ja") is None and normalized.get("excerpt") is not None:
        normalized["excerpt_ja"] = normalized.get("excerpt")

    _merge_i18n_bag(normalized, bag)
    return normalized


def _extract_i18n_trailer(content: str) -> tuple[str, dict[str, Any]]:
    if not content:
        return "", {}
    idx = content.rfind(_I18N_MARKER_OPEN)
    if idx < 0:
        return content, {}
    start = idx + len(_I18N_MARKER_OPEN)
    end = content.find(_I18N_MARKER_CLOSE, start)
    if end < 0:
        return content, {}
    raw = content[start:end].strip()
    try:
        bag = json.loads(raw)
    except json.JSONDecodeError:
        return content, {}
    body = content[:idx].rstrip()
    return body, bag if isinstance(bag, dict) else {}


def _clean_i18n_bag(bag: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for lang in ("en", "id"):
        entry = bag.get(lang) or {}
        if not isinstance(entry, dict):
            continue
        title = str(entry.get("title") or "").strip()
        excerpt = str(entry.get("excerpt") or "").strip()
        body = str(entry.get("content") or "").strip()
        if not (title or excerpt or body):
            continue
        cleaned[lang] = {
            "title": title or None,
            "excerpt": excerpt or None,
            "content": body or None,
        }
    return cleaned


def _pack_i18n_trailer(content_ja: str, bag: dict[str, Any]) -> str:
    body, _ = _extract_i18n_trailer(content_ja)
    cleaned = _clean_i18n_bag(bag)
    if not cleaned:
        return body
    payload = json.dumps(cleaned, ensure_ascii=False, separators=(",", ":"))
    return f"{body}\n\n{_I18N_MARKER_OPEN}{payload}{_I18N_MARKER_CLOSE}"


def _merge_i18n_bag(row: dict[str, Any], bag: dict[str, Any]) -> None:
    for lang, title_key, excerpt_key, content_key in (
        ("en", "title_en", "excerpt_en", "content_en"),
        ("id", "title_id", "excerpt_id", "content_id"),
    ):
        entry = bag.get(lang) or {}
        if not isinstance(entry, dict):
            continue
        if entry.get("title") and not (row.get(title_key) or "").strip():
            row[title_key] = entry["title"]
        if entry.get("excerpt") and not (row.get(excerpt_key) or "").strip():
            row[excerpt_key] = entry["excerpt"]
        if entry.get("content") and not (row.get(content_key) or "").strip():
            row[content_key] = entry["content"]


@lru_cache(maxsize=1)
def _posts_have_i18n_columns() -> bool:
    try:
        get_supabase_client().table("posts").select("title_en").limit(1).execute()
        return True
    except Exception:
        return False


def _prepare_payload_for_storage(
    data: dict[str, Any],
    *,
    existing: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Write i18n via real columns when available; otherwise embed in content."""
    out = dict(data)

    if _posts_have_i18n_columns():
        if "content" in out and out["content"] is not None:
            body, _ = _extract_i18n_trailer(str(out["content"]))
            out["content"] = body
            if "content_ja" in out:
                out["content_ja"] = body
        return out

    existing_body = ""
    existing_bag: dict[str, Any] = {}
    if existing:
        existing_body = str(
            existing.get("content_ja") or existing.get("content") or ""
        )
        existing_body, trailer_bag = _extract_i18n_trailer(existing_body)
        existing_bag = {
            "en": {
                "title": existing.get("title_en") or (trailer_bag.get("en") or {}).get("title"),
                "excerpt": existing.get("excerpt_en")
                or (trailer_bag.get("en") or {}).get("excerpt"),
                "content": existing.get("content_en")
                or (trailer_bag.get("en") or {}).get("content"),
            },
            "id": {
                "title": existing.get("title_id") or (trailer_bag.get("id") or {}).get("title"),
                "excerpt": existing.get("excerpt_id")
                or (trailer_bag.get("id") or {}).get("excerpt"),
                "content": existing.get("content_id")
                or (trailer_bag.get("id") or {}).get("content"),
            },
        }

    bag: dict[str, Any] = {
        "en": dict(existing_bag.get("en") or {}),
        "id": dict(existing_bag.get("id") or {}),
    }
    touched = False
    for lang, title_key, excerpt_key, content_key in (
        ("en", "title_en", "excerpt_en", "content_en"),
        ("id", "title_id", "excerpt_id", "content_id"),
    ):
        if title_key in out:
            bag[lang]["title"] = out.pop(title_key)
            touched = True
        if excerpt_key in out:
            bag[lang]["excerpt"] = out.pop(excerpt_key)
            touched = True
        if content_key in out:
            bag[lang]["content"] = out.pop(content_key)
            touched = True

    for key in ("title_ja", "content_ja", "excerpt_ja"):
        out.pop(key, None)

    if "content" in out or touched:
        content_ja = out["content"] if "content" in out else existing_body
        body, _ = _extract_i18n_trailer(str(content_ja or ""))
        out["content"] = _pack_i18n_trailer(body, bag)
        logger.info("Packed post i18n into content trailer (migration pending)")

    return out


def _is_missing_column_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return (
        "could not find" in text
        or "pgrst204" in text
        or "42703" in text
        or "does not exist" in text
    )


def _write_post_row(
    client: Any,
    data: dict[str, Any],
    *,
    post_id: str | None = None,
    existing: dict[str, Any] | None = None,
) -> Any:
    prepared = _prepare_payload_for_storage(data, existing=existing)
    try:
        if post_id:
            return client.table("posts").update(prepared).eq("id", post_id).execute()
        return client.table("posts").insert(prepared).execute()
    except Exception as exc:
        # Columns may have been added after process start; retry packed write once.
        if _posts_have_i18n_columns() and _is_missing_column_error(exc):
            _posts_have_i18n_columns.cache_clear()
            prepared = _prepare_payload_for_storage(data, existing=existing)
            if post_id:
                return client.table("posts").update(prepared).eq("id", post_id).execute()
            return client.table("posts").insert(prepared).execute()
        raise


def promote_due_scheduled_posts() -> int:
    """
    Promote scheduled posts whose scheduled_at has passed.

    TODO: scheduled posts publish job
    - Move this to a cron / worker (e.g. every minute)
    - Optionally send notification when published
    """
    client = get_supabase_client()
    now = _now_iso()
    result = (
        client.table("posts")
        .update(
            {
                "status": "published",
                "published_at": now,
            }
        )
        .eq("status", "scheduled")
        .lte("scheduled_at", now)
        .execute()
    )
    return len(result.data or [])


def list_posts(
    *,
    keyword: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 20,
    public_only: bool = False,
) -> dict[str, Any]:
    client = get_supabase_client()
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    if public_only:
        promote_due_scheduled_posts()

    query = client.table("posts").select(POST_SELECT, count="exact")

    if public_only:
        now = _now_iso()
        query = (
            query.eq("status", "published")
            .or_(f"published_at.is.null,published_at.lte.{now}")
        )
    elif status:
        query = query.eq("status", status)
    else:
        # Admin list excludes archived by default unless explicitly requested
        query = query.neq("status", "archived")

    if keyword:
        query = query.or_(
            f"title.ilike.%{keyword}%,excerpt.ilike.%{keyword}%,content.ilike.%{keyword}%"
        )

    if category:
        # category can be id or slug
        if _looks_like_uuid(category):
            query = query.eq("category_id", category)
        else:
            category_row = _fetch_one(
                client.table("post_categories").select("id").eq("slug", category)
            )
            if not category_row:
                return {"items": [], "total": 0, "page": page, "limit": limit}
            query = query.eq("category_id", category_row["id"])

    if tag:
        # Filter via embedded relation is limited; fetch tag id then filter relation
        tag_id = _resolve_tag_id(tag)
        if tag_id:
            relation_rows = (
                client.table("post_tag_relations")
                .select("post_id")
                .eq("tag_id", tag_id)
                .execute()
                .data
                or []
            )
            post_ids = [row["post_id"] for row in relation_rows]
            if not post_ids:
                return {"items": [], "total": 0, "page": page, "limit": limit}
            query = query.in_("id", post_ids)

    query = query.order("published_at", desc=True).order("created_at", desc=True)
    result = query.range(start, end).execute()
    items = [normalize_post(row) for row in (result.data or [])]
    return {
        "items": items,
        "total": result.count or len(items),
        "page": page,
        "limit": limit,
    }


def _first_or_none(data: Any) -> dict[str, Any] | None:
    if not data:
        return None
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


def get_post_by_id(post_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    result = (
        client.table("posts")
        .select(POST_SELECT)
        .eq("id", post_id)
        .limit(1)
        .execute()
    )
    post = normalize_post(_first_or_none(result.data))
    if not post:
        raise PostNotFoundError("記事が見つかりません。")
    return post


def get_public_post_by_slug(slug: str) -> dict[str, Any]:
    promote_due_scheduled_posts()
    client = get_supabase_client()
    now = _now_iso()
    result = (
        client.table("posts")
        .select(POST_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .or_(f"published_at.is.null,published_at.lte.{now}")
        .limit(1)
        .execute()
    )
    post = normalize_post(_first_or_none(result.data))
    if not post:
        raise PostNotFoundError("公開記事が見つかりません。")
    return post


def _looks_like_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except Exception:
        return False


def _resolve_tag_id(tag: str) -> str | None:
    client = get_supabase_client()
    if _looks_like_uuid(tag):
        return tag
    row = (
        client.table("post_tags")
        .select("id")
        .eq("slug", tag)
        .maybe_single()
        .execute()
        .data
    )
    return row["id"] if row else None


def _fetch_one(query: Any) -> dict[str, Any] | None:
    """Fetch at most one row without PostgREST 406 on empty results."""
    result = query.limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None


def _ensure_unique_slug(slug: str, exclude_id: str | None = None) -> None:
    client = get_supabase_client()
    query = client.table("posts").select("id").eq("slug", slug)
    if exclude_id:
        query = query.neq("id", exclude_id)
    if _fetch_one(query):
        raise PostConflictError("スラッグが重複しています")


def _validate_payload(payload: dict[str, Any], *, partial: bool = False) -> dict[str, Any]:
    data = dict(payload)

    has_title_keys = any(k in data for k in ("title", "title_ja", "title_en", "title_id"))
    if not partial or has_title_keys:
        title_ja = str(data.get("title_ja") or data.get("title") or "").strip()
        if not title_ja and not partial:
            raise PostValidationError("記事タイトルは必須です。")
        if title_ja or not partial:
            data["title"] = title_ja
            data["title_ja"] = title_ja
        if "title_en" in data:
            data["title_en"] = str(data.get("title_en") or "").strip() or None
        if "title_id" in data:
            data["title_id"] = str(data.get("title_id") or "").strip() or None

    if not partial or "slug" in data:
        slug = (data.get("slug") or "").strip()
        if not slug:
            raise PostValidationError("slugは必須です。")
        data["slug"] = slug

    has_content_keys = any(
        k in data for k in ("content", "content_ja", "content_en", "content_id")
    )
    if not partial or has_content_keys:
        content_ja = data.get("content_ja")
        if content_ja is None:
            content_ja = data.get("content")
        if (content_ja is None or str(content_ja).strip() == "") and not partial:
            raise PostValidationError("本文は必須です。")
        if content_ja is not None:
            data["content"] = str(content_ja)
            data["content_ja"] = str(content_ja)
        if "content_en" in data:
            en = data.get("content_en")
            data["content_en"] = None if en is None or str(en).strip() == "" else str(en)
        if "content_id" in data:
            id_body = data.get("content_id")
            data["content_id"] = (
                None if id_body is None or str(id_body).strip() == "" else str(id_body)
            )

    if any(k in data for k in ("excerpt", "excerpt_ja", "excerpt_en", "excerpt_id")):
        excerpt_ja = data.get("excerpt_ja")
        if excerpt_ja is None:
            excerpt_ja = data.get("excerpt")
        if excerpt_ja is not None:
            text = str(excerpt_ja).strip()
            data["excerpt"] = text or None
            data["excerpt_ja"] = text or None
        if "excerpt_en" in data:
            en = data.get("excerpt_en")
            data["excerpt_en"] = None if en is None or str(en).strip() == "" else str(en).strip()
        if "excerpt_id" in data:
            id_ex = data.get("excerpt_id")
            data["excerpt_id"] = (
                None if id_ex is None or str(id_ex).strip() == "" else str(id_ex).strip()
            )

    if "status" in data:
        status = data["status"]
        if status not in ALLOWED_POST_STATUSES:
            raise PostValidationError("statusの値が不正です。")

    seo_description = data.get("seo_description")
    if seo_description and len(str(seo_description)) > 160:
        # soft recommendation: keep but warn via truncation? Spec says 160推奨 - validate soft
        data["seo_description"] = str(seo_description)[:160]

    status = data.get("status")
    scheduled_at = data.get("scheduled_at")
    published_at = data.get("published_at")

    if status == "scheduled":
        if not scheduled_at:
            raise PostValidationError("公開予約には予約日時が必要です。")
        data["published_at"] = None
    elif status == "published":
        data["published_at"] = published_at or _now_iso()
        data["scheduled_at"] = None
    elif status == "draft":
        data["scheduled_at"] = None

    if data.get("category_id") in ("", None):
        data["category_id"] = None

    return data


def _sync_tags(post_id: str, tags: list[Any] | None) -> None:
    if tags is None:
        return

    client = get_supabase_client()
    client.table("post_tag_relations").delete().eq("post_id", post_id).execute()

    tag_ids: list[str] = []
    for item in tags:
        if isinstance(item, dict):
            tag_id = item.get("id")
            name = (item.get("name") or "").strip()
            slug = (item.get("slug") or "").strip()
        else:
            tag_id = None
            name = str(item).strip()
            slug = ""

        if tag_id:
            tag_ids.append(tag_id)
            continue

        if not name:
            continue

        slug = slug or _slugify_label(name)
        existing = (
            client.table("post_tags")
            .select("*")
            .eq("slug", slug)
            .maybe_single()
            .execute()
            .data
        )
        if existing:
            tag_ids.append(existing["id"])
            continue

        created = (
            client.table("post_tags")
            .insert({"name": name, "slug": slug})
            .execute()
            .data
            or []
        )
        if created:
            tag_ids.append(created[0]["id"])

    if tag_ids:
        rows = [{"post_id": post_id, "tag_id": tag_id} for tag_id in dict.fromkeys(tag_ids)]
        client.table("post_tag_relations").insert(rows).execute()


def create_post(payload: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
    data = _validate_payload(payload, partial=False)
    tags = data.pop("tags", None)
    _ensure_unique_slug(data["slug"])

    if "status" not in data:
        data["status"] = "draft"

    if user_id:
        data["created_by"] = user_id
        data["updated_by"] = user_id

    client = get_supabase_client()
    result = _write_post_row(client, data)
    created = (result.data or [None])[0]
    if not created:
        raise RuntimeError("記事の保存に失敗しました")

    _sync_tags(created["id"], tags)
    return get_post_by_id(created["id"])


def update_post(
    post_id: str,
    payload: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    existing = get_post_by_id(post_id)
    update_data = _validate_payload(payload, partial=True)
    tags = update_data.pop("tags", None)

    if "slug" in update_data:
        _ensure_unique_slug(update_data["slug"], exclude_id=post_id)

    merged_status = update_data.get("status", existing.get("status"))
    if "status" in update_data or "scheduled_at" in update_data or "published_at" in update_data:
        if merged_status == "scheduled":
            scheduled_at = update_data.get("scheduled_at", existing.get("scheduled_at"))
            if not scheduled_at:
                raise PostValidationError("公開予約には予約日時が必要です。")
            update_data["status"] = "scheduled"
            update_data["scheduled_at"] = scheduled_at
            update_data["published_at"] = None
        elif merged_status == "published":
            update_data["status"] = "published"
            update_data["published_at"] = (
                update_data.get("published_at")
                or existing.get("published_at")
                or _now_iso()
            )
            update_data["scheduled_at"] = None
        elif merged_status == "draft":
            update_data["status"] = "draft"
            update_data["scheduled_at"] = None
        elif merged_status == "archived":
            update_data["status"] = "archived"

    if user_id:
        update_data["updated_by"] = user_id

    if not update_data and "tags" not in payload:
        raise PostValidationError("更新する項目がありません。")

    client = get_supabase_client()
    if update_data:
        result = _write_post_row(client, update_data, post_id=post_id)
        if not result.data:
            raise PostNotFoundError("記事が見つかりません。")

    if "tags" in payload:
        _sync_tags(post_id, tags if isinstance(tags, list) else [])

    return get_post_by_id(post_id)


def archive_post(post_id: str, user_id: str | None = None) -> dict[str, Any]:
    return update_post(post_id, {"status": "archived"}, user_id=user_id)


def list_categories() -> list[dict[str, Any]]:
    client = get_supabase_client()
    result = (
        client.table("post_categories")
        .select("*")
        .order("name", desc=False)
        .execute()
    )
    return result.data or []


def create_category(payload: dict[str, Any]) -> dict[str, Any]:
    name = (payload.get("name") or "").strip()
    slug = (payload.get("slug") or "").strip() or _slugify_label(name)
    description = payload.get("description")
    if not name:
        raise PostValidationError("カテゴリー名は必須です。")

    client = get_supabase_client()
    existing = (
        client.table("post_categories")
        .select("id")
        .eq("slug", slug)
        .maybe_single()
        .execute()
        .data
    )
    if existing:
        raise PostConflictError("スラッグが重複しています")

    result = (
        client.table("post_categories")
        .insert({"name": name, "slug": slug, "description": description})
        .execute()
    )
    return (result.data or [None])[0]


def update_category(category_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    data: dict[str, Any] = {}
    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            raise PostValidationError("カテゴリー名は必須です。")
        data["name"] = name
    if "slug" in payload:
        slug = (payload.get("slug") or "").strip()
        if not slug:
            raise PostValidationError("slugは必須です。")
        data["slug"] = slug
    if "description" in payload:
        data["description"] = payload.get("description")

    if not data:
        raise PostValidationError("更新する項目がありません。")

    client = get_supabase_client()
    if "slug" in data:
        existing = _fetch_one(
            client.table("post_categories")
            .select("id")
            .eq("slug", data["slug"])
            .neq("id", category_id)
        )
        if existing:
            raise PostConflictError("スラッグが重複しています")

    result = (
        client.table("post_categories")
        .update(data)
        .eq("id", category_id)
        .execute()
    )
    if not result.data:
        raise PostNotFoundError("カテゴリーが見つかりません。")
    return result.data[0]


def delete_category(category_id: str) -> None:
    client = get_supabase_client()
    used = (
        client.table("posts")
        .select("id")
        .eq("category_id", category_id)
        .neq("status", "archived")
        .limit(1)
        .execute()
        .data
    )
    if used:
        raise PostValidationError(
            "このカテゴリーを使用中の記事があるため削除できません。"
        )

    result = (
        client.table("post_categories")
        .delete()
        .eq("id", category_id)
        .execute()
    )
    if result.data is None:
        # supabase may return empty list
        pass


def list_tags() -> list[dict[str, Any]]:
    client = get_supabase_client()
    result = client.table("post_tags").select("*").order("name", desc=False).execute()
    return result.data or []


def create_tag(payload: dict[str, Any]) -> dict[str, Any]:
    name = (payload.get("name") or "").strip()
    slug = (payload.get("slug") or "").strip() or _slugify_label(name)
    if not name:
        raise PostValidationError("タグ名は必須です。")

    client = get_supabase_client()
    existing = (
        client.table("post_tags")
        .select("id")
        .eq("slug", slug)
        .maybe_single()
        .execute()
        .data
    )
    if existing:
        raise PostConflictError("スラッグが重複しています")

    result = client.table("post_tags").insert({"name": name, "slug": slug}).execute()
    return (result.data or [None])[0]


def upload_post_image(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    folder: str = "featured",
) -> dict[str, str]:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise PostValidationError("対応形式は jpg / jpeg / png / webp です。")
    if len(file_bytes) > MAX_IMAGE_BYTES:
        raise PostValidationError("画像サイズは5MB以下にしてください。")

    safe_folder = "featured" if folder not in {"featured", "content"} else folder
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    if extension == "jpeg":
        extension = "jpg"
    object_path = f"{safe_folder}/{uuid.uuid4().hex}.{extension}"

    client = get_supabase_client()
    client.storage.from_("posts").upload(
        object_path,
        file_bytes,
        {"content-type": content_type, "upsert": "false"},
    )
    public_url = client.storage.from_("posts").get_public_url(object_path)
    return {"path": object_path, "url": public_url}
