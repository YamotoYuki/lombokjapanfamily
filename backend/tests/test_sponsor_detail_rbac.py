"""Sponsor detail API: admin / editor only (same as the RequireEditor
detail screen). Viewers get 403 `forbidden` — an operation-level denial,
so the client must not sign them out.

Runs the real resolve_auth_user() path; only the Supabase lookups and the
sponsor fetch are mocked.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from utils import auth

PROFILE = {"id": "u-1", "email": "a@example.com", "status": "active", "deleted_at": None}
SPONSOR = {"id": "s-1", "company_name": "C", "amount": 100.0}


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
    with (
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=_client_for(role)),
        patch("routes.sponsor_routes.sponsor_service.get_sponsor", return_value=SPONSOR) as get,
    ):
        response = create_app().test_client().get(path, headers={"Authorization": "Bearer tok"})
    return response, get


@pytest.mark.parametrize("role", ["admin", "editor"])
def test_admin_and_editor_can_read_sponsor_detail(role):
    response, get = _get("/api/sponsors/s-1", role)
    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == "s-1"
    get.assert_called_once_with("s-1")


def test_viewer_is_denied_sponsor_detail():
    response, get = _get("/api/sponsors/s-1", "viewer")
    assert response.status_code == 403
    assert response.get_json()["code"] == auth.CODE_FORBIDDEN
    get.assert_not_called()


def test_sponsor_detail_without_token_is_401():
    response = create_app().test_client().get("/api/sponsors/s-1")
    assert response.status_code == 401
