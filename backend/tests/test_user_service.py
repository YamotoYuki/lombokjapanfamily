from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from gotrue.errors import AuthApiError

from services import user_service


def _table_mock():
    """A Supabase .table(...) stand-in whose chain methods return
    themselves, so tests only need to set what .execute() yields."""
    table = MagicMock()
    table.select.return_value = table
    table.eq.return_value = table
    table.insert.return_value = table
    table.update.return_value = table
    table.execute.return_value = MagicMock(data=[{"id": "profile-row"}])
    return table


def _client_mock():
    client = MagicMock()
    client.table.return_value = _table_mock()
    return client


def _auth_client_mock(user_id: str = "new-user-1"):
    created = MagicMock(user=MagicMock(id=user_id, email="new-admin@example.com"))
    auth_client = MagicMock()
    auth_client.auth.admin.create_user = MagicMock(return_value=created)
    auth_client.auth.admin.delete_user = MagicMock()
    return auth_client


@pytest.fixture(autouse=True)
def no_real_audit_writes():
    with patch("services.user_service.write_audit_log") as mock_audit:
        yield mock_audit


@pytest.fixture(autouse=True)
def no_real_get_user():
    """get_user() does its own Supabase table calls; stub it to a fixed
    record so create_user()'s tests stay focused on the creation flow."""
    with patch(
        "services.user_service.get_user",
        return_value={"id": "new-user-1", "email": "new-admin@example.com", "role": "admin"},
    ) as mock_get_user:
        yield mock_get_user


def test_create_admin_success(no_real_audit_writes, no_real_get_user):
    client = _client_mock()
    auth_client = _auth_client_mock()
    with (
        patch("services.user_service.get_supabase_client", return_value=client),
        patch("services.user_service.create_scoped_client", return_value=auth_client),
    ):
        result = user_service.create_user(
            email="new-admin@example.com",
            password="correct-horse-battery",
            role="admin",
            actor_id="actor-1",
        )

    assert result["id"] == "new-user-1"
    auth_client.auth.admin.create_user.assert_called_once()
    insert_call = client.table.return_value.insert.call_args.args[0]
    assert insert_call["role"] == "admin"
    assert insert_call["user_id"] == "new-user-1"
    auth_client.auth.admin.delete_user.assert_not_called()
    assert no_real_audit_writes.call_args.kwargs["action"] == "ADMIN_CREATED"
    assert no_real_audit_writes.call_args.kwargs["user_id"] == "actor-1"


def test_create_user_non_admin_role_logs_user_created(
    no_real_audit_writes, no_real_get_user
):
    client = _client_mock()
    auth_client = _auth_client_mock()
    with (
        patch("services.user_service.get_supabase_client", return_value=client),
        patch("services.user_service.create_scoped_client", return_value=auth_client),
    ):
        user_service.create_user(
            email="new-editor@example.com",
            password="correct-horse-battery",
            role="editor",
            actor_id="actor-1",
        )
    assert no_real_audit_writes.call_args.kwargs["action"] == "USER_CREATED"


def test_create_user_invalid_role_rejected(no_real_audit_writes):
    with pytest.raises(user_service.ValidationError):
        user_service.create_user(
            email="x@example.com",
            password="correct-horse-battery",
            role="superadmin",
            actor_id="actor-1",
        )


def test_create_user_short_password_rejected(no_real_audit_writes):
    with pytest.raises(user_service.ValidationError):
        user_service.create_user(
            email="x@example.com",
            password="short",
            role="admin",
            actor_id="actor-1",
        )


def test_create_user_empty_password_rejected(no_real_audit_writes):
    with pytest.raises(user_service.ValidationError):
        user_service.create_user(
            email="x@example.com",
            password="",
            role="admin",
            actor_id="actor-1",
        )


def test_create_user_invalid_email_rejected(no_real_audit_writes):
    with pytest.raises(user_service.ValidationError):
        user_service.create_user(
            email="not-an-email",
            password="correct-horse-battery",
            role="admin",
            actor_id="actor-1",
        )


def test_create_user_duplicate_email(no_real_audit_writes):
    auth_client = MagicMock()
    auth_client.auth.admin.create_user = MagicMock(
        side_effect=AuthApiError(
            "A user with this email address has already been registered",
            422,
            "email_exists",
        )
    )
    with patch("services.user_service.create_scoped_client", return_value=auth_client):
        with pytest.raises(user_service.UserConflictError):
            user_service.create_user(
                email="dup@example.com",
                password="correct-horse-battery",
                role="admin",
                actor_id="actor-1",
            )


def test_create_user_rolls_back_auth_user_on_role_insert_failure(
    no_real_audit_writes, no_real_get_user
):
    client = MagicMock()
    broken_table = MagicMock()
    broken_table.insert.return_value = broken_table
    broken_table.execute.side_effect = RuntimeError("db unavailable")
    client.table.return_value = broken_table
    auth_client = _auth_client_mock()

    with (
        patch("services.user_service.get_supabase_client", return_value=client),
        patch("services.user_service.create_scoped_client", return_value=auth_client),
    ):
        with pytest.raises(RuntimeError):
            user_service.create_user(
                email="new-admin@example.com",
                password="correct-horse-battery",
                role="admin",
                actor_id="actor-1",
            )

    auth_client.auth.admin.delete_user.assert_called_once_with("new-user-1")
    no_real_audit_writes.assert_not_called()


def test_create_user_optional_display_name(no_real_audit_writes, no_real_get_user):
    client = _client_mock()
    auth_client = _auth_client_mock()
    with (
        patch("services.user_service.get_supabase_client", return_value=client),
        patch("services.user_service.create_scoped_client", return_value=auth_client),
        patch("services.user_service.update_profile") as mock_update_profile,
    ):
        user_service.create_user(
            email="new-admin@example.com",
            password="correct-horse-battery",
            role="admin",
            display_name="  Admin Taro  ",
            actor_id="actor-1",
        )
    mock_update_profile.assert_called_once_with(
        "new-user-1", {"display_name": "Admin Taro"}, actor_id="actor-1"
    )
