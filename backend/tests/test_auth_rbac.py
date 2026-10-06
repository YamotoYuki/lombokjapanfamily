"""A-2: per-request auth must deny role-less / suspended / deleted accounts,
and report lookup outages as 503 (not as "no permission")."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from gotrue.errors import AuthApiError

from app import create_app
from utils import auth


def _table(rows):
    table = MagicMock()
    table.select.return_value = table
    table.eq.return_value = table
    table.limit.return_value = table
    if isinstance(rows, Exception):
        table.execute.side_effect = rows
    else:
        table.execute.return_value = MagicMock(data=rows)
    return table


def _client(profile_rows, role_rows):
    tables = {"profiles": _table(profile_rows), "user_roles": _table(role_rows)}
    client = MagicMock()
    client.table.side_effect = lambda name: tables[name]
    return client


ACTIVE_PROFILE = {"id": "u-1", "email": "a@example.com", "status": "active", "deleted_at": None}


@pytest.fixture(autouse=True)
def clear_auth_cache():
    auth._auth_cache.clear()
    yield
    auth._auth_cache.clear()


@pytest.fixture
def app():
    return create_app()


def _resolve(app, client):
    with (
        app.test_request_context(headers={"Authorization": "Bearer tok"}),
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=client),
    ):
        return auth.resolve_auth_user()


@pytest.mark.parametrize("role", ["admin", "editor", "viewer"])
def test_active_user_with_role_is_allowed(app, role):
    user = _resolve(app, _client([ACTIVE_PROFILE], [{"role": role}]))
    assert user.role == role
    assert user.status == "active"


def test_missing_role_is_denied_not_viewer(app):
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([ACTIVE_PROFILE], []))
    assert exc.value.status == 403
    assert exc.value.code == auth.CODE_ROLE_MISSING


def test_unknown_role_value_is_denied(app):
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([ACTIVE_PROFILE], [{"role": "superadmin"}]))
    assert exc.value.status == 403
    assert exc.value.code == auth.CODE_ROLE_MISSING


def test_missing_profile_is_denied(app):
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([], [{"role": "admin"}]))
    assert exc.value.status == 403


@pytest.mark.parametrize("status", ["suspended", "inactive"])
def test_non_active_status_is_denied(app, status):
    profile = {**ACTIVE_PROFILE, "status": status}
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([profile], [{"role": "admin"}]))
    assert exc.value.status == 403
    assert exc.value.code == auth.CODE_ACCOUNT_SUSPENDED


def test_deleted_profile_is_denied_even_with_admin_role(app):
    profile = {**ACTIVE_PROFILE, "deleted_at": "2026-10-01T00:00:00+00:00"}
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([profile], [{"role": "admin"}]))
    assert exc.value.status == 403
    assert exc.value.code == auth.CODE_ACCOUNT_DELETED


def test_role_lookup_failure_is_503_not_viewer(app):
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client([ACTIVE_PROFILE], RuntimeError("Server disconnected")))
    assert exc.value.status == 503
    assert exc.value.code == auth.CODE_AUTH_UNAVAILABLE


def test_profile_lookup_failure_is_503(app):
    with pytest.raises(auth.AuthError) as exc:
        _resolve(app, _client(RuntimeError("timeout"), [{"role": "admin"}]))
    assert exc.value.status == 503
    assert exc.value.code == auth.CODE_AUTH_UNAVAILABLE


def test_denied_user_is_not_cached(app):
    with pytest.raises(auth.AuthError):
        _resolve(app, _client([ACTIVE_PROFILE], []))
    assert auth._auth_cache == {}


def test_invalidate_auth_cache_drops_only_that_user(app):
    _resolve(app, _client([ACTIVE_PROFILE], [{"role": "admin"}]))
    other = auth.AuthUser(id="u-2", email=None, role="editor", status="active")
    auth._cache_set("other-token", other)
    assert len(auth._auth_cache) == 2

    auth.invalidate_auth_cache("u-1")

    remaining = [user.id for _, user in auth._auth_cache.values()]
    assert remaining == ["u-2"]


def test_auth_api_rejection_is_401(app):
    client = MagicMock()
    client.auth.get_user.side_effect = AuthApiError("invalid JWT", 401, "bad_jwt")
    with (
        app.test_request_context(),
        patch("utils.auth.get_supabase_client", return_value=client),
        pytest.raises(auth.AuthError) as exc,
    ):
        auth._user_payload_from_auth_api("tok")
    assert exc.value.status == 401


def test_auth_api_network_error_is_503(app):
    client = MagicMock()
    client.auth.get_user.side_effect = ConnectionError("network down")
    with (
        app.test_request_context(),
        patch("utils.auth.get_supabase_client", return_value=client),
        pytest.raises(auth.AuthError) as exc,
    ):
        auth._user_payload_from_auth_api("tok")
    assert exc.value.status == 503


def test_is_staff_request_false_for_role_less_user(app):
    with (
        app.test_request_context(headers={"Authorization": "Bearer tok"}),
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=_client([ACTIVE_PROFILE], [])),
    ):
        assert auth.is_staff_request() is False


# --- HTTP level: reason codes reach the client --------------------------------


def _get(app, path, client):
    with (
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=client),
    ):
        return app.test_client().get(path, headers={"Authorization": "Bearer tok"})


@pytest.mark.parametrize(
    "path",
    ["/api/analytics/summary", "/api/sponsors", "/api/gallery/stats", "/api/auth/session"],
)
def test_role_less_user_gets_403_role_missing_on_staff_apis(app, path):
    response = _get(app, path, _client([ACTIVE_PROFILE], []))
    assert response.status_code == 403
    assert response.get_json()["code"] == auth.CODE_ROLE_MISSING


def test_suspended_user_gets_account_suspended_code(app):
    profile = {**ACTIVE_PROFILE, "status": "suspended"}
    response = _get(app, "/api/auth/session", _client([profile], [{"role": "editor"}]))
    assert response.status_code == 403
    assert response.get_json()["code"] == auth.CODE_ACCOUNT_SUSPENDED


def test_role_lookup_outage_gives_503_auth_unavailable(app):
    response = _get(app, "/api/auth/session", _client([ACTIVE_PROFILE], RuntimeError("down")))
    assert response.status_code == 503
    assert response.get_json()["code"] == auth.CODE_AUTH_UNAVAILABLE


def test_editor_on_admin_api_gets_forbidden_not_account_code(app):
    response = _get(app, "/api/users", _client([ACTIVE_PROFILE], [{"role": "editor"}]))
    assert response.status_code == 403
    assert response.get_json()["code"] == auth.CODE_FORBIDDEN


def test_session_endpoint_returns_profile_and_role(app):
    profile_row = {**ACTIVE_PROFILE, "display_name": "Admin"}
    tables = {
        "profiles": _table([profile_row]),
        "user_roles": _table([{"role": "admin"}]),
    }
    client = MagicMock()
    client.table.side_effect = lambda name: tables[name]
    with (
        patch("utils.auth._decode_supabase_jwt", return_value={"sub": "u-1"}),
        patch("utils.auth.get_supabase_client", return_value=client),
        patch("routes.auth_routes.get_supabase_client", return_value=client),
    ):
        response = app.test_client().get(
            "/api/auth/session", headers={"Authorization": "Bearer tok"}
        )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["role"] == "admin"
    assert data["profile"]["display_name"] == "Admin"


def test_user_listing_shows_missing_role_as_unassigned_not_viewer():
    from services import user_service

    assert user_service._normalize_user({"id": "u-1"}, None)["role"] is None
    assert user_service._normalize_user({"id": "u-1"}, "bogus")["role"] is None
    assert user_service._normalize_user({"id": "u-1"}, "editor")["role"] == "editor"


def test_user_stats_counts_role_less_users_separately():
    from services import user_service

    profiles = _table([{"id": "a"}, {"id": "b"}, {"id": "c"}])
    profiles.is_.return_value = profiles
    roles = _table([{"role": "admin"}, {"role": "viewer"}])
    roles.in_.return_value = roles
    client = MagicMock()
    client.table.side_effect = lambda name: {"profiles": profiles, "user_roles": roles}[name]
    with patch("services.user_service.get_supabase_client", return_value=client):
        stats = user_service.get_user_stats()
    assert stats["viewer_count"] == 1
    assert stats["unassigned_count"] == 1
    assert stats["total"] == 3


def test_session_endpoint_without_token_is_401(app):
    response = app.test_client().get("/api/auth/session")
    assert response.status_code == 401
