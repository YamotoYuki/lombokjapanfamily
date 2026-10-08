"""Sponsor read APIs (list / stats / detail): admin / editor only, same as
the RequireEditor sponsor screens. Viewers get 403 `forbidden` — an
operation-level denial, so the client must not sign them out.

Runs the real resolve_auth_user() path; only the Supabase lookups and the
sponsor service calls are mocked.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from utils import auth

PROFILE = {"id": "u-1", "email": "a@example.com", "status": "active", "deleted_at": None}
SPONSOR = {"id": "s-1", "company_name": "C", "amount": 100.0}

# path -> (sponsor_service function the route calls, its fake result)
READ_APIS = {
    "/api/sponsors/s-1": ("get_sponsor", SPONSOR),
    "/api/sponsors": (
        "list_sponsors",
        {"items": [SPONSOR], "page": 1, "limit": 20, "total": 1},
    ),
    "/api/sponsors/stats": ("get_sponsor_stats", {"total": 1, "in_progress_count": 0}),
}


def _table(rows):
    table = MagicMock()
    for method in ("select", "eq", "limit"):
        getattr(table, method).return_value = table
    table.execute.return_value = MagicMock(data=rows)
    return table


def _client_for(role: str):
    tables = {"profiles": _table([PROFILE]), "user_roles": _table([{"role": role}])}
    client = MagicMock()
    client.table.side_effect = lambda name: tables[name]
    return client


@pytest.fixture(autouse=True)
def clear_auth_cache():
    auth._auth_cache.clear()
    yield
    auth._auth_cache.clear()


def _get(path: str, role: str):
    func, result = READ_APIS[path]
    with (
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=_client_for(role)),
        patch(f"routes.sponsor_routes.sponsor_service.{func}", return_value=result) as call,
    ):
        response = create_app().test_client().get(path, headers={"Authorization": "Bearer tok"})
    return response, call


@pytest.mark.parametrize("path", READ_APIS)
@pytest.mark.parametrize("role", ["admin", "editor"])
def test_admin_and_editor_can_read_sponsor_apis(path, role):
    response, call = _get(path, role)
    assert response.status_code == 200
    assert response.get_json()["data"] == READ_APIS[path][1]
    call.assert_called_once()


@pytest.mark.parametrize("path", READ_APIS)
def test_viewer_is_denied_sponsor_apis(path):
    response, call = _get(path, "viewer")
    assert response.status_code == 403
    assert response.get_json()["code"] == auth.CODE_FORBIDDEN
    call.assert_not_called()


@pytest.mark.parametrize("path", READ_APIS)
def test_sponsor_apis_without_token_are_401(path):
    response = create_app().test_client().get(path)
    assert response.status_code == 401
