"""A-1 (login side): a correct password must not yield a session for a
suspended / deleted / banned / role-less account; last_login_at is written
by the backend; outages are 503, not "wrong password"."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from gotrue.errors import AuthApiError

from app import create_app
from services import auth_service


def _table(rows):
    table = MagicMock()
    for method in ("select", "eq", "limit", "update", "insert"):
        getattr(table, method).return_value = table
    if isinstance(rows, Exception):
        table.execute.side_effect = rows
    else:
        table.execute.return_value = MagicMock(data=rows)
    return table


def _client(profile_rows, role_rows, lockout_rows=None):
    tables = {
        "login_lockouts": _table(lockout_rows or []),
        "profiles": _table(profile_rows),
        "user_roles": _table(role_rows),
    }
    client = MagicMock()
    client.table.side_effect = lambda name: tables[name]
    client.tables = tables
    return client


def _session():
    return MagicMock(
        session=MagicMock(
            access_token="at-1",
            refresh_token="rt-1",
            expires_in=3600,
            expires_at=9999999999,
            token_type="bearer",
        ),
        user=MagicMock(id="u-1", email="a@example.com"),
    )


def _auth_client(sign_in_result=None, sign_in_error=None):
    auth_client = MagicMock()
    if sign_in_error is not None:
        auth_client.auth.sign_in_with_password.side_effect = sign_in_error
    else:
        auth_client.auth.sign_in_with_password.return_value = sign_in_result or _session()
    return auth_client


ACTIVE = {"id": "u-1", "email": "a@example.com", "status": "active", "deleted_at": None}


@pytest.fixture(autouse=True)
def audit():
    with patch("services.auth_service.write_audit_log") as mock_audit:
        yield mock_audit


def _sign_in(client, auth_client):
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch("services.auth_service.create_scoped_client", return_value=auth_client),
    ):
        return auth_service.sign_in("a@example.com", "correct-password")


def test_active_admin_logs_in_and_last_login_is_recorded(audit):
    client = _client([ACTIVE], [{"role": "admin"}])
    result = _sign_in(client, _auth_client())

    assert result["access_token"] == "at-1"
    profile_update = client.tables["profiles"].update.call_args.args[0]
    assert set(profile_update) == {"last_login_at"}
    assert audit.call_args.kwargs["action"] == "ADMIN_LOGIN_SUCCESS"


@pytest.mark.parametrize(
    "profile,roles,code",
    [
        ({**ACTIVE, "status": "suspended"}, [{"role": "admin"}], "account_suspended"),
        ({**ACTIVE, "status": "inactive"}, [{"role": "editor"}], "account_suspended"),
        ({**ACTIVE, "deleted_at": "2026-10-01T00:00:00Z"}, [{"role": "admin"}], "account_deleted"),
        (ACTIVE, [], "role_missing"),
    ],
)
def test_blocked_account_gets_no_session(audit, profile, roles, code):
    client = _client([profile], roles)
    auth_client = _auth_client()
    with pytest.raises(auth_service.AccountBlockedError) as exc:
        _sign_in(client, auth_client)

    assert exc.value.code == code
    # Session minted by the password check is revoked, not returned.
    auth_client.auth.admin.sign_out.assert_called_once_with("at-1")
    # Not a failed attempt: lockout row untouched, last_login not written.
    client.tables["login_lockouts"].insert.assert_not_called()
    client.tables["login_lockouts"].update.assert_not_called()
    client.tables["profiles"].update.assert_not_called()
    assert audit.call_args.kwargs["action"] == "ADMIN_LOGIN_BLOCKED"


def test_supabase_ban_reported_as_suspended_not_wrong_password(audit):
    client = _client([ACTIVE], [{"role": "admin"}])
    banned = AuthApiError("User is banned", 400, "user_banned")
    with pytest.raises(auth_service.AccountBlockedError) as exc:
        _sign_in(client, _auth_client(sign_in_error=banned))

    assert exc.value.code == "account_suspended"
    client.tables["login_lockouts"].insert.assert_not_called()
    client.tables["login_lockouts"].update.assert_not_called()


def test_wrong_password_still_counts_as_failed_attempt(audit):
    client = _client([ACTIVE], [{"role": "admin"}])
    wrong = AuthApiError("Invalid login credentials", 400, "invalid_credentials")
    with pytest.raises(auth_service.InvalidCredentialsError):
        _sign_in(client, _auth_client(sign_in_error=wrong))
    client.tables["login_lockouts"].insert.assert_called_once()


def test_role_lookup_outage_is_unavailable_not_blocked(audit):
    client = _client([ACTIVE], RuntimeError("Server disconnected"))
    auth_client = _auth_client()
    with pytest.raises(auth_service.AuthUnavailableError):
        _sign_in(client, auth_client)
    auth_client.auth.admin.sign_out.assert_called_once()
    client.tables["login_lockouts"].insert.assert_not_called()


def test_last_login_failure_does_not_fail_login(audit):
    client = _client([ACTIVE], [{"role": "editor"}])
    client.tables["profiles"].update.side_effect = RuntimeError("write failed")
    result = _sign_in(client, _auth_client())
    assert result["access_token"] == "at-1"


# --- HTTP mapping -------------------------------------------------------------


def _post_login(side_effect):
    app = create_app()
    with patch("routes.auth_routes.auth_service.sign_in", side_effect=side_effect):
        return app.test_client().post(
            "/api/auth/login", json={"email": "a@example.com", "password": "x"}
        )


def test_login_route_maps_blocked_to_403_with_code():
    response = _post_login(auth_service.AccountBlockedError("停止中", "account_suspended"))
    assert response.status_code == 403
    assert response.get_json()["code"] == "account_suspended"


def test_login_route_maps_unavailable_to_503():
    response = _post_login(auth_service.AuthUnavailableError("確認できません", "auth_unavailable"))
    assert response.status_code == 503
    assert response.get_json()["code"] == "auth_unavailable"
