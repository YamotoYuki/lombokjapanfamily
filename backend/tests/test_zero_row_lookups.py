"""Zero-row lookups must never crash (maybe_single regression).

With postgrest-py 0.19, `.maybe_single().execute()` returns None — not an
empty response — when no row matches, so a trailing `.data` raised
AttributeError and the API answered 500: creating a new blog category /
tag / gallery category failed every time, and an unknown id gave 500
instead of 404.

MagicMock-based tests cannot catch this, because the bug lives in the real
client's handling of PostgREST's 406 "0 rows" reply. These tests therefore
run the real supabase client against a small in-process fake PostgREST
that answers exactly like the real one (single-object request with != 1
row -> 406 PGRST116).
"""

from __future__ import annotations

import json
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from unittest.mock import patch
from urllib.parse import parse_qsl, urlsplit

import pytest
from supabase import create_client

from app import create_app
from services import (
    announcement_service,
    family_service,
    gallery_service,
    notification_banner_service,
    post_service,
    sponsor_service,
    supabase_service,
)
from utils.auth import AuthUser

# Any JWT-shaped string: supabase-py validates the key format, the fake
# server never checks it.
FAKE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.c2lnbmF0dXJl"
MISSING_ID = "00000000-0000-0000-0000-000000000000"
EDITOR = AuthUser(id="u-1", email="e@example.com", role="editor", status="active")

_RESERVED_PARAMS = {"select", "order", "limit", "offset", "columns", "on_conflict"}


class FakePostgrest:
    """Minimal in-memory PostgREST: eq/neq filters, limit, CRUD."""

    def __init__(self) -> None:
        self.tables: dict[str, list[dict[str, Any]]] = {}
        self.lock = threading.Lock()

    def seed(self, table: str, *rows: dict[str, Any]) -> None:
        self.tables.setdefault(table, []).extend(dict(row) for row in rows)

    def rows(self, table: str) -> list[dict[str, Any]]:
        return self.tables.get(table, [])

    @staticmethod
    def matches(row: dict[str, Any], filters: list[tuple[str, str]]) -> bool:
        for column, expr in filters:
            op, _, value = expr.partition(".")
            current = "" if row.get(column) is None else str(row.get(column))
            if op == "eq" and current != value:
                return False
            if op == "neq" and current == value:
                return False
        return True


def _make_handler(db: FakePostgrest):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args: Any) -> None:  # keep pytest output quiet
            pass

        def _parse(self) -> tuple[str, list[tuple[str, str]], int | None]:
            parts = urlsplit(self.path)
            table = parts.path.rsplit("/", 1)[-1]
            filters: list[tuple[str, str]] = []
            limit: int | None = None
            for key, value in parse_qsl(parts.query, keep_blank_values=True):
                if key == "limit":
                    limit = int(value)
                elif key not in _RESERVED_PARAMS:
                    filters.append((key, value))
            return table, filters, limit

        def _body(self) -> Any:
            length = int(self.headers.get("Content-Length") or 0)
            return json.loads(self.rfile.read(length) or b"null")

        def _send(self, status: int, payload: Any) -> None:
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self) -> None:
            table, filters, limit = self._parse()
            with db.lock:
                found = [r for r in db.rows(table) if db.matches(r, filters)]
            if limit is not None:
                found = found[:limit]
            if "vnd.pgrst.object" in (self.headers.get("Accept") or ""):
                if len(found) != 1:
                    self._send(
                        406,
                        {
                            "code": "PGRST116",
                            "details": f"The result contains {len(found)} rows",
                            "hint": None,
                            "message": "JSON object requested, multiple (or no) rows returned",
                        },
                    )
                    return
                self._send(200, found[0])
                return
            self._send(200, found)

        def do_POST(self) -> None:
            table, _, _ = self._parse()
            body = self._body()
            items = body if isinstance(body, list) else [body]
            created = []
            with db.lock:
                for item in items:
                    row = {"id": str(uuid.uuid4()), **item}
                    db.tables.setdefault(table, []).append(row)
                    created.append(row)
            self._send(201, created)

        def do_PATCH(self) -> None:
            table, filters, _ = self._parse()
            body = self._body() or {}
            with db.lock:
                updated = [r for r in db.rows(table) if db.matches(r, filters)]
                for row in updated:
                    row.update(body)
            self._send(200, updated)

        def do_DELETE(self) -> None:
            table, filters, _ = self._parse()
            self._body()  # drain any request body, or the socket is reset
            with db.lock:
                removed = [r for r in db.rows(table) if db.matches(r, filters)]
                db.tables[table] = [r for r in db.rows(table) if r not in removed]
            self._send(200, removed)

    return Handler


@pytest.fixture
def fake_db(monkeypatch: pytest.MonkeyPatch):
    db = FakePostgrest()
    server = ThreadingHTTPServer(("127.0.0.1", 0), _make_handler(db))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    client = create_client(f"http://127.0.0.1:{server.server_port}", FAKE_KEY)
    for module in (
        announcement_service,
        family_service,
        gallery_service,
        notification_banner_service,
        post_service,
        sponsor_service,
        supabase_service,
    ):
        monkeypatch.setattr(module, "get_supabase_client", lambda: client)
    try:
        yield db
    finally:
        server.shutdown()
        server.server_close()


@pytest.fixture
def http(fake_db):
    return create_app().test_client()


def _as_editor():
    """Authorize as an editor on every route module touched below."""
    return (
        patch("routes.post_routes.require_editor", return_value=(EDITOR, None)),
        patch("routes.gallery_routes.require_editor", return_value=(EDITOR, None)),
        patch("routes.youtube_routes.require_staff", return_value=(EDITOR, None)),
        patch("routes.sponsor_routes.require_editor", return_value=(EDITOR, None)),
    )


@pytest.fixture
def editor():
    p = _as_editor()
    with p[0], p[1], p[2], p[3]:
        yield


# --- blog categories / tags (create: the normal path is "no existing slug") -----


def test_create_post_category_succeeds(http, fake_db, editor):
    response = http.post("/api/post-categories", json={"name": "Travel", "slug": "travel"})
    assert response.status_code == 201
    assert response.get_json()["data"]["slug"] == "travel"
    assert [r["slug"] for r in fake_db.rows("post_categories")] == ["travel"]


def test_create_post_category_duplicate_slug_is_409(http, fake_db, editor):
    fake_db.seed("post_categories", {"id": "c-1", "name": "Travel", "slug": "travel"})
    response = http.post("/api/post-categories", json={"name": "Travel", "slug": "travel"})
    assert response.status_code == 409
    assert len(fake_db.rows("post_categories")) == 1


def test_create_post_tag_succeeds(http, fake_db, editor):
    response = http.post("/api/post-tags", json={"name": "Food", "slug": "food"})
    assert response.status_code == 201
    assert [r["slug"] for r in fake_db.rows("post_tags")] == ["food"]


def test_create_post_tag_duplicate_slug_is_409(http, fake_db, editor):
    fake_db.seed("post_tags", {"id": "t-1", "name": "Food", "slug": "food"})
    response = http.post("/api/post-tags", json={"name": "Food", "slug": "food"})
    assert response.status_code == 409


def test_sync_tags_creates_new_tag_and_reuses_existing(fake_db):
    fake_db.seed("post_tags", {"id": "t-old", "name": "Old", "slug": "old"})
    post_service._sync_tags(
        "p-1", [{"name": "Old", "slug": "old"}, {"name": "Brand New", "slug": "brand-new"}]
    )
    slugs = sorted(r["slug"] for r in fake_db.rows("post_tags"))
    assert slugs == ["brand-new", "old"]
    new_id = next(r["id"] for r in fake_db.rows("post_tags") if r["slug"] == "brand-new")
    related = sorted(r["tag_id"] for r in fake_db.rows("post_tag_relations"))
    assert related == sorted(["t-old", new_id])


def test_resolve_tag_id_known_and_unknown_slug(fake_db):
    fake_db.seed("post_tags", {"id": "t-1", "name": "Food", "slug": "food"})
    assert post_service._resolve_tag_id("food") == "t-1"
    assert post_service._resolve_tag_id("no-such-tag") is None


# --- gallery categories ----------------------------------------------------------


def test_create_gallery_category_succeeds(http, fake_db, editor):
    response = http.post("/api/gallery-categories", json={"name": "Beach", "slug": "beach"})
    assert response.status_code == 201
    assert [r["slug"] for r in fake_db.rows("gallery_categories")] == ["beach"]


def test_create_gallery_category_duplicate_slug_is_409(http, fake_db, editor):
    fake_db.seed("gallery_categories", {"id": "g-1", "name": "Beach", "slug": "beach"})
    response = http.post("/api/gallery-categories", json={"name": "Beach", "slug": "beach"})
    assert response.status_code == 409


def test_update_gallery_category_with_free_slug_succeeds(http, fake_db, editor):
    fake_db.seed("gallery_categories", {"id": "g-1", "name": "Beach", "slug": "beach"})
    response = http.patch("/api/gallery-categories/g-1", json={"name": "Sea", "slug": "sea"})
    assert response.status_code == 200
    assert fake_db.rows("gallery_categories")[0]["slug"] == "sea"


def test_update_gallery_category_slug_taken_by_other_is_409(http, fake_db, editor):
    fake_db.seed(
        "gallery_categories",
        {"id": "g-1", "name": "Beach", "slug": "beach"},
        {"id": "g-2", "name": "Sea", "slug": "sea"},
    )
    response = http.patch("/api/gallery-categories/g-1", json={"slug": "sea"})
    assert response.status_code == 409


def test_update_missing_gallery_category_is_404(http, fake_db, editor):
    response = http.patch(f"/api/gallery-categories/{MISSING_ID}", json={"name": "X"})
    assert response.status_code == 404


def test_delete_missing_gallery_category_is_404(http, fake_db, editor):
    response = http.delete(f"/api/gallery-categories/{MISSING_ID}")
    assert response.status_code == 404


# --- detail lookups: existing -> 200, unknown id -> 404 (not 500) ----------------


def test_family_detail_existing_and_missing(http, fake_db):
    fake_db.seed("family_profiles", {"id": "f-1", "name": "A", "is_visible": True})
    assert http.get("/api/family/f-1").status_code == 200
    assert http.get(f"/api/family/{MISSING_ID}").status_code == 404


def test_announcement_detail_existing_and_missing(http, fake_db):
    fake_db.seed("announcements", {"id": "a-1", "title_ja": "T", "is_published": True})
    assert http.get("/api/announcements/a-1").status_code == 200
    assert http.get(f"/api/announcements/{MISSING_ID}").status_code == 404


def test_notification_banner_detail_existing_and_missing(http, fake_db):
    fake_db.seed("notification_banners", {"id": "b-1", "is_active": True})
    assert http.get("/api/notification-banners/b-1").status_code == 200
    assert http.get(f"/api/notification-banners/{MISSING_ID}").status_code == 404


def test_video_detail_existing_and_missing(http, fake_db, editor):
    fake_db.seed("videos", {"id": "v-1", "title": "V"})
    assert http.get("/api/videos/v-1").status_code == 200
    assert http.get(f"/api/videos/{MISSING_ID}").status_code == 404


def test_sponsor_detail_existing_and_missing(http, fake_db, editor):
    fake_db.seed("sponsors", {"id": "s-1", "company_name": "C", "amount": 100})
    response = http.get("/api/sponsors/s-1")
    assert response.status_code == 200
    assert response.get_json()["data"]["amount"] == 100.0
    assert http.get(f"/api/sponsors/{MISSING_ID}").status_code == 404


def test_service_getters_raise_not_found_instead_of_attribute_error(fake_db):
    with pytest.raises(family_service.FamilyNotFoundError):
        family_service.get_family_profile(MISSING_ID)
    with pytest.raises(announcement_service.AnnouncementNotFoundError):
        announcement_service.get_announcement(MISSING_ID)
    with pytest.raises(notification_banner_service.NotificationBannerNotFoundError):
        notification_banner_service.get_banner(MISSING_ID)
    with pytest.raises(sponsor_service.SponsorNotFoundError):
        sponsor_service.get_sponsor(MISSING_ID)
    assert supabase_service.get_video(MISSING_ID) is None
