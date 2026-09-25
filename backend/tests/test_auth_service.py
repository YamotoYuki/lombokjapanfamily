from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from gotrue.errors import AuthApiError

from services import auth_service


def _table_mock(row: dict | None):
    """A Supabase .table("login_lockouts") stand-in whose select/eq/limit/
    update/insert chain always returns itself, so tests only need to set
    what .execute() yields."""
    table = MagicMock()
    table.select.return_value = table
    table.eq.return_value = table
    table.limit.return_value = table
    table.update.return_value = table
    table.insert.return_value = table
    table.execute.return_value = MagicMock(data=[row] if row else [])
    return table


def _client_mock(row: dict | None):
    client = MagicMock()
    client.table.return_value = _table_mock(row)
    return client


def _fake_session(user_id: str = "u-1", email: str = "admin@example.com"):
    session = MagicMock(
        access_token="at-1",
        refresh_token="rt-1",
        expires_in=3600,
        expires_at=9999999999,
        token_type="bearer",
    )
    user = MagicMock(id=user_id, email=email)
    return MagicMock(session=session, user=user)


@pytest.fixture(autouse=True)
def no_real_audit_writes():
    """write_audit_log() hits Supabase itself — stub it for every test here
    so these stay unit tests, and so we can assert on what got logged."""
    with patch("services.auth_service.write_audit_log") as mock_audit:
        yield mock_audit


def test_one_to_four_failures_do_not_lock(no_real_audit_writes):
    row = {"email": "admin@example.com", "failed_attempts": 3, "locked_until": None}
    client = _client_mock(row)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch(
            "services.auth_service.create_client",
            return_value=MagicMock(
                auth=MagicMock(
                    sign_in_with_password=MagicMock(
                        side_effect=AuthApiError("Invalid login credentials", 400, "invalid_grant")
                    )
                )
            ),
        ),
    ):
        with pytest.raises(auth_service.InvalidCredentialsError):
            auth_service.sign_in("admin@example.com", "wrong-password")

    # 4th failure: update() called with failed_attempts=4, no lock.
    update_call = client.table.return_value.update.call_args.args[0]
    assert update_call["failed_attempts"] == 4
    assert update_call["locked_until"] is None
    assert no_real_audit_writes.call_args.kwargs["action"] == "ADMIN_LOGIN_FAILED"


def test_fifth_failure_locks_for_one_hour(no_real_audit_writes):
    row = {"email": "admin@example.com", "failed_attempts": 4, "locked_until": None}
    client = _client_mock(row)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch(
            "services.auth_service.create_client",
            return_value=MagicMock(
                auth=MagicMock(
                    sign_in_with_password=MagicMock(
                        side_effect=AuthApiError("Invalid login credentials", 400, "invalid_grant")
                    )
                )
            ),
        ),
    ):
        with pytest.raises(auth_service.LoginLockedError) as exc_info:
            auth_service.sign_in("admin@example.com", "wrong-password")

    assert "5回失敗" in str(exc_info.value)
    update_call = client.table.return_value.update.call_args.args[0]
    assert update_call["failed_attempts"] == 5
    locked_until = datetime.fromisoformat(update_call["locked_until"])
    delta = locked_until - datetime.now(timezone.utc)
    assert timedelta(minutes=55) < delta <= timedelta(hours=1)
    assert no_real_audit_writes.call_args.kwargs["action"] == "ADMIN_LOGIN_LOCKED"


def test_locked_account_rejects_even_correct_password(no_real_audit_writes):
    future = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    row = {"email": "admin@example.com", "failed_attempts": 5, "locked_until": future}
    client = _client_mock(row)
    fake_gotrue = MagicMock(
        auth=MagicMock(sign_in_with_password=MagicMock(return_value=_fake_session()))
    )
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch("services.auth_service.create_client", return_value=fake_gotrue) as create_client_mock,
    ):
        with pytest.raises(auth_service.LoginLockedError) as exc_info:
            auth_service.sign_in("admin@example.com", "correct-password")

    assert "約" in str(exc_info.value)
    # Correct password never even reaches Supabase Auth while locked.
    create_client_mock.assert_not_called()
    fake_gotrue.auth.sign_in_with_password.assert_not_called()


def test_lock_expires_after_one_hour(no_real_audit_writes):
    past = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    row = {"email": "admin@example.com", "failed_attempts": 5, "locked_until": past}
    client = _client_mock(row)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch(
            "services.auth_service.create_client",
            return_value=MagicMock(
                auth=MagicMock(sign_in_with_password=MagicMock(return_value=_fake_session()))
            ),
        ),
    ):
        result = auth_service.sign_in("admin@example.com", "correct-password")

    assert result["access_token"] == "at-1"


def test_successful_login_resets_failed_attempts(no_real_audit_writes):
    row = {"email": "admin@example.com", "failed_attempts": 3, "locked_until": None}
    client = _client_mock(row)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch(
            "services.auth_service.create_client",
            return_value=MagicMock(
                auth=MagicMock(sign_in_with_password=MagicMock(return_value=_fake_session()))
            ),
        ),
    ):
        result = auth_service.sign_in("admin@example.com", "correct-password")

    assert result["user"]["id"] == "u-1"
    reset_call = client.table.return_value.update.call_args.args[0]
    assert reset_call == {"failed_attempts": 0, "locked_until": None}
    assert no_real_audit_writes.call_args.kwargs["action"] == "ADMIN_LOGIN_SUCCESS"


def test_first_ever_login_success_no_prior_row(no_real_audit_writes):
    """Existing Supabase Auth login must keep working for an email with no
    login_lockouts row at all yet (the common case, and the previous
    behavior before this feature existed)."""
    client = _client_mock(None)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch(
            "services.auth_service.create_client",
            return_value=MagicMock(
                auth=MagicMock(sign_in_with_password=MagicMock(return_value=_fake_session()))
            ),
        ),
    ):
        result = auth_service.sign_in("new-admin@example.com", "correct-password")

    assert result["access_token"] == "at-1"
    assert result["user"]["email"] == "admin@example.com"
    # No prior row -> nothing to reset.
    client.table.return_value.update.assert_not_called()


def test_repeated_attempts_while_locked_do_not_inflate_attempt_count(
    no_real_audit_writes,
):
    future = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    row = {"email": "admin@example.com", "failed_attempts": 5, "locked_until": future}
    client = _client_mock(row)
    with patch("services.auth_service.get_supabase_client", return_value=client):
        for _ in range(3):
            with pytest.raises(auth_service.LoginLockedError):
                auth_service.sign_in("admin@example.com", "whatever")

    # Locked short-circuit never calls update()/insert() on the lockout row.
    client.table.return_value.update.assert_not_called()
    client.table.return_value.insert.assert_not_called()


def test_empty_credentials_rejected_without_touching_supabase(no_real_audit_writes):
    client = _client_mock(None)
    with (
        patch("services.auth_service.get_supabase_client", return_value=client),
        patch("services.auth_service.create_client") as create_client_mock,
    ):
        with pytest.raises(auth_service.InvalidCredentialsError):
            auth_service.sign_in("", "")

    create_client_mock.assert_not_called()
