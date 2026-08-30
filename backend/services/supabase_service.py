from __future__ import annotations

import os
from functools import lru_cache

from supabase import Client, create_client


class SupabaseConfigError(RuntimeError):
    pass


def _ssl_verify_enabled() -> bool:
    raw = os.getenv("SUPABASE_SSL_VERIFY", "true").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _apply_local_ssl_workaround() -> None:
    """Allow disabling TLS verify for local/dev behind SSL-inspecting proxies."""
    if _ssl_verify_enabled():
        return
    import httpx

    if getattr(httpx.Client, "_ljf_ssl_patched", False):
        return

    original_init = httpx.Client.__init__

    def patched_init(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        kwargs["verify"] = False
        return original_init(self, *args, **kwargs)

    httpx.Client.__init__ = patched_init  # type: ignore[method-assign]
    httpx.Client._ljf_ssl_patched = True  # type: ignore[attr-defined]


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


def list_videos(
    *,
    q: str | None = None,
    category: str | None = None,
    is_visible: bool | None = None,
    is_featured: bool | None = None,
    show_on_home: bool | None = None,
) -> list[dict]:
    client = get_supabase_client()
    query = client.table("videos").select("*")

    if q:
        # PostgREST or filter on title/description
        query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
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


def upsert_videos(rows: list[dict]) -> list[dict]:
    if not rows:
        return []

    client = get_supabase_client()
    result = client.table("videos").upsert(rows, on_conflict="youtube_id").execute()
    return result.data or []


def update_video(video_id: str, payload: dict) -> dict | None:
    client = get_supabase_client()
    result = client.table("videos").update(payload).eq("id", video_id).execute()
    data = result.data or []
    return data[0] if data else None


def soft_delete_video(video_id: str) -> dict | None:
    return update_video(video_id, {"is_visible": False})
