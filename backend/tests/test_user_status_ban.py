"""A-1 (admin side): suspending / deleting bans the Supabase Auth account
first, then updates profiles; a failed profiles update rolls the ban back.
Reactivation updates profiles first, then lifts the ban."""

from __future__ import annotations

from unittest.mock import MagicMock, call, patch

import pytest

from services import user_service


@pytest.fixture(autouse=True)
def audit():
    with patch("services.user_service.write_audit_log") as mock_audit:
        yield mock_audit


@pytest.fixture
def events():
    """Ordered log of ban / profile-update calls across both clients."""
    return []


@pytest.fixture
def auth_client(events):
    client = MagicMock()
    client.auth.admin.update_user_by_id.side_effect = lambda uid, attrs: events.append(
        ("ban", attrs["ban_duration"])
    )
    return client


@pytest.fixture
def db(events):
    table = MagicMock()
    table.eq.return_value = table

    def _update(data):
        events.append(("profile", dict(data)))
        return table

    table.update.side_effect = _update
    table.execute.return_value = MagicMock(data=[{"id": "u-1"}])
    client = MagicMock()
    client.table.return_value = table
    client.profile_table = table
    return client


def _run(fn, *, current_status, auth_client, db, **kwargs):
    with (
        patch(
            "services.user_service.get_user",
            return_value={"id": "u-1", "email": "u@example.com", "status": current_status},
        ),
        patch("services.user_service.get_supabase_client", return_value=db),
        patch("services.user_service.create_scoped_client", return_value=auth_client),
        patch("services.user_service.invalidate_auth_cache") as invalidate,
    ):
        result = fn("u-1", actor_id="admin-1", **kwargs)
    return result, invalidate


@pytest.mark.parametrize("status", ["suspended", "inactive"])
def test_suspend_bans_auth_before_profile_update(events, auth_client, db, status):
    _, invalidate = _run(
        user_service.update_status, status=status, current_status="active",
        auth_client=auth_client, db=db,
    )
    assert events[0] == ("ban", user_service.AUTH_BAN_DURATION)
    assert events[1][0] == "profile"
    assert events[1][1]["status"] == status
    invalidate.assert_called_once_with("u-1")


def test_suspend_aborts_without_profile_change_when_ban_fails(events, auth_client, db):
    auth_client.auth.admin.update_user_by_id.side_effect = RuntimeError("auth down")
    with pytest.raises(user_service.AccountSyncError):
        _run(
            user_service.update_status, status="suspended", current_status="active",
            auth_client=auth_client, db=db,
        )
    assert not any(kind == "profile" for kind, _ in events)


def test_profile_update_failure_rolls_back_the_ban(events, auth_client, db):
    db.profile_table.execute.side_effect = RuntimeError("db down")
    with pytest.raises(RuntimeError):
        _run(
            user_service.update_status, status="suspended", current_status="active",
            auth_client=auth_client, db=db,
        )
    bans = [value for kind, value in events if kind == "ban"]
    assert bans == [user_service.AUTH_BAN_DURATION, user_service.AUTH_UNBAN]


def test_rollback_does_not_unban_a_user_who_was_already_inactive(events, auth_client, db):
    db.profile_table.execute.side_effect = RuntimeError("db down")
    with pytest.raises(RuntimeError):
        _run(
            user_service.update_status, status="inactive", current_status="suspended",
            auth_client=auth_client, db=db,
        )
    bans = [value for kind, value in events if kind == "ban"]
    assert bans == [user_service.AUTH_BAN_DURATION]


def test_failed_rollback_is_logged_for_manual_repair(events, auth_client, db, caplog):
    calls = {"n": 0}

    def _ban(uid, attrs):
        calls["n"] += 1
        if calls["n"] == 2:
            raise RuntimeError("unban failed")

    auth_client.auth.admin.update_user_by_id.side_effect = _ban
    db.profile_table.execute.side_effect = RuntimeError("db down")
    with pytest.raises(RuntimeError, match="db down"):
        _run(
            user_service.update_status, status="suspended", current_status="active",
            auth_client=auth_client, db=db,
        )
    assert "MANUAL FIX NEEDED" in caplog.text


def test_reactivate_updates_profile_then_unbans(events, auth_client, db):
    _run(
        user_service.update_status, status="active", current_status="suspended",
        auth_client=auth_client, db=db,
    )
    assert events[0] == ("profile", {**events[0][1], "status": "active"})
    assert events[1] == ("ban", user_service.AUTH_UNBAN)


def test_reactivate_restores_previous_status_when_unban_fails(events, auth_client, db):
    auth_client.auth.admin.update_user_by_id.side_effect = RuntimeError("auth down")
    with pytest.raises(user_service.AccountSyncError):
        _run(
            user_service.update_status, status="active", current_status="suspended",
            auth_client=auth_client, db=db,
        )
    statuses = [value["status"] for kind, value in events if kind == "profile"]
    assert statuses == ["active", "suspended"]


def test_soft_delete_bans_then_marks_deleted(events, auth_client, db, audit):
    result, invalidate = _run(
        user_service.soft_delete_user, current_status="active",
        auth_client=auth_client, db=db,
    )
    assert events[0] == ("ban", user_service.AUTH_BAN_DURATION)
    assert events[1][1]["status"] == "inactive"
    assert events[1][1]["deleted_at"]
    assert result["deleted_at"]
    invalidate.assert_called_once_with("u-1")
    assert audit.call_args.kwargs["action"] == "USER_DELETED"


def test_soft_delete_rolls_back_ban_on_profile_failure(events, auth_client, db):
    db.profile_table.execute.side_effect = RuntimeError("db down")
    with pytest.raises(RuntimeError):
        _run(
            user_service.soft_delete_user, current_status="active",
            auth_client=auth_client, db=db,
        )
    bans = [value for kind, value in events if kind == "ban"]
    assert bans == [user_service.AUTH_BAN_DURATION, user_service.AUTH_UNBAN]


def test_ban_uses_a_scoped_client_not_the_shared_singleton(auth_client, db):
    with (
        patch("services.user_service.create_scoped_client", return_value=auth_client) as scoped,
        patch("services.user_service.get_supabase_client", return_value=db),
    ):
        user_service._set_auth_ban("u-1", banned=True)
    scoped.assert_called_once()
    assert auth_client.auth.admin.update_user_by_id.call_args == call(
        "u-1", {"ban_duration": user_service.AUTH_BAN_DURATION}
    )
    db.auth.admin.update_user_by_id.assert_not_called()
