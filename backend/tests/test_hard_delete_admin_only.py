"""A-7: ?hard=true deletes are admin-only; soft delete stays editor-level.

The backend talks to Supabase with the service-role key, so the DB's
"DELETE is admin-only" RLS never applies here — the route check is the only
enforcement and must hold on every hard-delete endpoint."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app import create_app
from utils.auth import CODE_FORBIDDEN, AuthUser

EDITOR = AuthUser(id="editor-1", email="e@example.com", role="editor", status="active")
ADMIN = AuthUser(id="admin-1", email="a@example.com", role="admin", status="active")

# (url, route module, hard service fn, soft service fn)
ENDPOINTS = [
    (
        "/api/contacts/c-1",
        "routes.contact_routes",
        "routes.contact_routes.contact_service.hard_delete_contact",
        "routes.contact_routes.contact_service.archive_contact",
    ),
    (
        "/api/family/f-1",
        "routes.family_routes",
        "routes.family_routes.family_service.hard_delete_family_profile",
        "routes.family_routes.family_service.soft_delete_family_profile",
    ),
    (
        "/api/gallery/g-1",
        "routes.gallery_routes",
        "routes.gallery_routes.gallery_service.hard_delete_gallery_item",
        "routes.gallery_routes.gallery_service.soft_delete_gallery_item",
    ),
    (
        "/api/announcements/a-1",
        "routes.announcement_routes",
        "routes.announcement_routes.announcement_service.delete_announcement",
        "routes.announcement_routes.announcement_service.soft_delete_announcement",
    ),
]


@pytest.fixture
def client():
    return create_app().test_client()


@pytest.fixture(autouse=True)
def no_audit_writes():
    with patch("services.audit_service.write_audit_log"):
        yield


@pytest.mark.parametrize("url,module,hard_fn,soft_fn", ENDPOINTS)
def test_editor_hard_delete_is_forbidden_and_never_deletes(client, url, module, hard_fn, soft_fn):
    with (
        patch(f"{module}.require_editor", return_value=(EDITOR, None)),
        patch(hard_fn) as hard_mock,
        patch(soft_fn) as soft_mock,
    ):
        response = client.delete(f"{url}?hard=true")
    assert response.status_code == 403
    assert response.get_json()["code"] == CODE_FORBIDDEN
    hard_mock.assert_not_called()
    soft_mock.assert_not_called()


@pytest.mark.parametrize("flag", ["1", "true", "TRUE", "yes"])
def test_every_hard_flag_spelling_is_gated(client, flag):
    url, module, hard_fn, _ = ENDPOINTS[0]
    with (
        patch(f"{module}.require_editor", return_value=(EDITOR, None)),
        patch(hard_fn) as hard_mock,
    ):
        response = client.delete(f"{url}?hard={flag}")
    assert response.status_code == 403
    hard_mock.assert_not_called()


@pytest.mark.parametrize("url,module,hard_fn,soft_fn", ENDPOINTS)
def test_admin_hard_delete_still_works(client, url, module, hard_fn, soft_fn):
    with (
        patch(f"{module}.require_editor", return_value=(ADMIN, None)),
        patch(hard_fn, return_value={"id": "x"}) as hard_mock,
        patch(soft_fn) as soft_mock,
    ):
        response = client.delete(f"{url}?hard=true")
    assert response.status_code == 200
    hard_mock.assert_called_once()
    soft_mock.assert_not_called()


@pytest.mark.parametrize("url,module,hard_fn,soft_fn", ENDPOINTS)
def test_editor_soft_delete_still_works(client, url, module, hard_fn, soft_fn):
    with (
        patch(f"{module}.require_editor", return_value=(EDITOR, None)),
        patch(hard_fn) as hard_mock,
        patch(soft_fn, return_value={"id": "x"}) as soft_mock,
    ):
        response = client.delete(url)
    assert response.status_code == 200
    soft_mock.assert_called_once()
    hard_mock.assert_not_called()


@pytest.mark.parametrize("url,module,hard_fn,soft_fn", ENDPOINTS)
def test_unauthenticated_hard_delete_is_rejected(client, url, module, hard_fn, soft_fn):
    with patch(hard_fn) as hard_mock:
        response = client.delete(f"{url}?hard=true")
    assert response.status_code == 401
    hard_mock.assert_not_called()
