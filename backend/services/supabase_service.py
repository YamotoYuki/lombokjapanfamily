from __future__ import annotations

import logging
import os
import time
from functools import lru_cache

from supabase import Client, create_client

from utils.validators import build_or_filter, sanitize_search_term

logger = logging.getLogger(__name__)


class SupabaseConfigError(RuntimeError):
    pass


def _ssl_verify_enabled() -> bool:
    raw = os.getenv("SUPABASE_SSL_VERIFY", "true").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _apply_local_ssl_workaround() -> None:
    """Allow disabling TLS verify for local/dev behind SSL-inspecting proxies."""
    if _ssl_verify_enabled():
        return

    from utils.env_check import is_production_runtime

    if is_production_runtime():
        raise SupabaseConfigError(
            "SUPABASE_SSL_VERIFY=false is not allowed in production."
        )

    import httpx

    if getattr(httpx.Client, "_ljf_ssl_patched", False):
        return

    original_init = httpx.Client.__init__

    def patched_init(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        kwargs["verify"] = False
        return original_init(self, *args, **kwargs)

    httpx.Client.__init__ = patched_init  # type: ignore[method-assign]
    httpx.Client._ljf_ssl_patched = True  # type: ignore[attr-defined]
    logger.warning(
        "SUPABASE_SSL_VERIFY disabled — TLS certificate verification is OFF (dev only)."
    )


def _is_transient_supabase_error(exc: BaseException) -> bool:
    text = str(exc).lower()
    return any(
        needle in text
        for needle in (
            "server disconnected",
            "connectionterminated",
            "connection reset",
            "remoteprotocolerror",
            "readerror",
            "connecterror",
            "temporarily unavailable",
        )
    )


def execute_with_retry(operation, *, attempts: int = 2, delay_sec: float = 0.15):
    """Retry once on transient Supabase/HTTP2 disconnects."""
    last_exc: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except BaseException as exc:  # noqa: BLE001 — surface after retries
            last_exc = exc
            if attempt >= attempts or not _is_transient_supabase_error(exc):
                raise
            logger.warning(
                "transient supabase error (attempt %s/%s): %s",
                attempt,
                attempts,
                exc,
            )
            time.sleep(delay_sec * attempt)
    assert last_exc is not None
    raise last_exc


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not url:
        raise SupabaseConfigError("SUPABASE_URL が設定されていません。")
    if not key:
        raise SupabaseConfigError("SUPABASE_SERVICE_ROLE_KEY が設定されていません。")
    if key.startswith("http://") or key.startswith("https://") or "/rest/v1" in key:
        raise SupabaseConfigError(
            "SUPABASE_SERVICE_ROLE_KEY に URL が入っています。"
            " Dashboard の service_role / secret key を設定してください。"
        )

    _apply_local_ssl_workaround()
    return create_client(url, key)


def create_scoped_client() -> Client:
    """A fresh, non-cached Supabase client — deliberately NOT the
    get_supabase_client() singleton above.

    Needed for any Supabase Auth call that establishes or verifies a
    session (sign_in_with_password, auth.admin.create_user, ...): those
    mutate the calling client's own internal auth state (supabase-py's
    _listen_to_auth_events re-points the client's postgrest Authorization
    header at whatever session the call just touched). get_supabase_client()
    is a process-wide, @lru_cache'd singleton shared by every request, so
    doing that there would corrupt the service-role access every other
    concurrent request depends on. Each call to this function returns an
    independent, throwaway client instead, discarded after use.
    """
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not url:
        raise SupabaseConfigError("SUPABASE_URL が設定されていません。")
    if not key:
        raise SupabaseConfigError("SUPABASE_SERVICE_ROLE_KEY が設定されていません。")

    _apply_local_ssl_workaround()
    return create_client(url, key)


def list_videos(
    *,
    q: str | None = None,
    category: str | None = None,
    is_visible: bool | None = None,
    is_featured: bool | None = None,
    show_on_home: bool | None = None,
) -> list[dict]:
    def _run() -> list[dict]:
        client = get_supabase_client()
        query = client.table("videos").select("*")

        if q:
            term = sanitize_search_term(q)
            or_clause = build_or_filter(term, ["title", "description"])
            if or_clause:
                query = query.or_(or_clause)
        if category:
            query = query.eq("category", category)
        if is_visible is not None:
            query = query.eq("is_visible", is_visible)
        if is_featured is not None:
            query = query.eq("is_featured", is_featured)
        if show_on_home is not None:
            query = query.eq("show_on_home", show_on_home)

        query = query.order("display_order", desc=False).order("published_at", desc=True)
        result = query.execute()
        return result.data or []

    return execute_with_retry(_run)


ALLOWED_VIDEO_SORTS = frozenset({"newest", "popular", "oldest"})


def list_videos_page(
    *,
    q: str | None = None,
    category: str | None = None,
    is_visible: bool | None = None,
    is_featured: bool | None = None,
    show_on_home: bool | None = None,
    page: int = 1,
    limit: int = 10,
    sort: str | None = None,
) -> dict:
    """Paginated sibling of list_videos() — fetches only the current page's
    rows plus a true total count, instead of every matching row. Kept as a
    separate function (rather than adding page/limit to list_videos itself)
    because list_videos is also used where the *full* filtered set is
    required (the home page's "show up to 6" fallback, and the admin video
    list's client-side featured-count check), and must keep returning every
    matching row for those callers.

    `sort` ("newest" | "popular" | "oldest") is applied as a DB-level ORDER
    BY — "popular" sorts by the `views` column (synced from the YouTube API,
    the only view-count data this project stores) so ranking by popularity
    never requires fetching every row to sort client-side."""
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    def _run() -> dict:
        client = get_supabase_client()
        query = client.table("videos").select("*", count="exact")

        if q:
            term = sanitize_search_term(q)
            or_clause = build_or_filter(term, ["title", "description"])
            if or_clause:
                query = query.or_(or_clause)
        if category:
            query = query.eq("category", category)
        if is_visible is not None:
            query = query.eq("is_visible", is_visible)
        if is_featured is not None:
            query = query.eq("is_featured", is_featured)
        if show_on_home is not None:
            query = query.eq("show_on_home", show_on_home)

        if sort == "popular":
            query = query.order("views", desc=True).order("published_at", desc=True)
        elif sort == "oldest":
            query = query.order("published_at", desc=False).order(
                "display_order", desc=False
            )
        elif sort == "newest":
            query = query.order("published_at", desc=True).order(
                "display_order", desc=False
            )
        else:
            # No explicit sort requested — original list_videos() ordering.
            query = query.order("display_order", desc=False).order(
                "published_at", desc=True
            )
        result = query.range(start, end).execute()
        return {
            "items": result.data or [],
            "total": result.count or 0,
            "page": page,
            "limit": limit,
        }

    return execute_with_retry(_run)


def count_featured_videos(*, exclude_id: str | None = None) -> int:
    client = get_supabase_client()
    query = client.table("videos").select("id", count="exact").eq(
        "is_featured", True
    )
    if exclude_id:
        query = query.neq("id", exclude_id)
    return query.execute().count or 0


def upsert_videos(rows: list[dict]) -> list[dict]:
    if not rows:
        return []

    client = get_supabase_client()
    result = (
        client.table("videos")
        .upsert(rows, on_conflict="youtube_id")
        .execute()
    )
    return result.data or []


def get_video(video_id: str) -> dict | None:
    client = get_supabase_client()
    rows = (
        client.table("videos")
        .select("*")
        .eq("id", video_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    return rows[0] if rows else None


def update_video(video_id: str, payload: dict) -> dict | None:
    client = get_supabase_client()
    result = (
        client.table("videos")
        .update(payload)
        .eq("id", video_id)
        .execute()
    )
    data = result.data or []
    return data[0] if data else None


def soft_delete_video(video_id: str) -> dict | None:
    return update_video(video_id, {"is_visible": False})
