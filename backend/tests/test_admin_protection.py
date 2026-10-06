"""A-4: an admin cannot demote/suspend/delete themselves, and no change may
leave the CMS without an active admin — including when two admins race
(check -> change -> re-count -> undo own change)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from services import user_service
from utils.auth import AuthUser

ADMIN_TARGET = {"id": "u-2", "email": "b@example.com", "role": "admin", "status": "active"}
EDITOR_TARGET = {"id": "u-2", "email": "b@example.com", "role": "editor", "status": "active"}


@pytest.fixture(autouse=True)
def audit():
    with patch("services.user_service.write_audit_log"):
        yield


@pytest.fixture
def roles_table():
    table = MagicMock()
    for method in ("select", "eq", "limit", "update", "insert"):
        getattr(table, method).return_value = table
    table.execute.return_value = MagicMock(data=[{"id": "r-2", "role": "admin"}])
    return table


@pytest.fixture
def db(roles_table):
    client = MagicMock()
    client.table.return_value = roles_table
    return client


def _patched(target, counts, db):
    """Patch the collaborators; `counts` feeds successive
    _count_active_admins() results (pre-check, post-check)."""
    return (
        patch("services.user_service.get_user", return_value=target),
        patch("services.user_service.get_supabase_client", return_value=db),
        patch("services.user_service._count_active_admins", side_effect=counts),
        patch("services.user_service._set_auth_ban"),
        patch("services.user_service._update_profile_row"),
        patch("services.user_service.invalidate_auth_cache"),
    )


# --- self modification ---------------------------------------------------------


def test_admin_cannot_change_own_role():
    with pytest.raises(user_service.SelfModificationError):
        user_service.update_role("u-1", "editor", actor_id="u-1")


def test_admin_cannot_change_own_status():
    with pytest.raises(user_service.SelfModificationError):
        user_service.update_status("u-1", "suspended", actor_id="u-1")


def test_admin_cannot_delete_self_at_service_level():
    with pytest.raises(user_service.SelfModificationError):
        user_service.soft_delete_user("u-1", actor_id="u-1")


# --- last admin: pre-check ------------------------------------------------------


def test_cannot_demote_the_last_active_admin(db, roles_table):
    p = _patched(ADMIN_TARGET, [1], db)
    with p[0], p[1], p[2], p[3], p[4], p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.update_role("u-2", "editor", actor_id="u-1")
    roles_table.update.assert_not_called()


def test_cannot_suspend_the_last_active_admin(db):
    p = _patched(ADMIN_TARGET, [1], db)
    with p[0], p[1], p[2], p[3] as ban, p[4] as profile, p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.update_status("u-2", "suspended", actor_id="u-1")
    ban.assert_not_called()
    profile.assert_not_called()


def test_cannot_delete_the_last_active_admin(db):
    p = _patched(ADMIN_TARGET, [1], db)
    with p[0], p[1], p[2], p[3] as ban, p[4], p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.soft_delete_user("u-2", actor_id="u-1")
    ban.assert_not_called()


def test_demoting_an_admin_is_fine_when_another_admin_remains(db, roles_table):
    p = _patched(ADMIN_TARGET, [2, 1], db)
    with p[0], p[1], p[2], p[3], p[4], p[5]:
        user_service.update_role("u-2", "editor", actor_id="u-1")
    assert roles_table.update.call_args.args[0]["role"] == "editor"


def test_non_admin_changes_skip_admin_counting(db):
    p = _patched(EDITOR_TARGET, [], db)
    with p[0], p[1], p[2] as count, p[3], p[4], p[5]:
        user_service.update_status("u-2", "suspended", actor_id="u-1")
    count.assert_not_called()


def test_promoting_to_admin_never_blocked(db, roles_table):
    p = _patched(EDITOR_TARGET, [], db)
    with p[0], p[1], p[2] as count, p[3], p[4], p[5]:
        user_service.update_role("u-2", "admin", actor_id="u-1")
    count.assert_not_called()


# --- last admin: race post-check -------------------------------------------------


def test_concurrent_demotion_race_undoes_own_role_change(db, roles_table):
    # Pre-check sees 2 admins, but by the post-check the other admin was
    # demoted concurrently -> 0 left -> our demotion is reverted.
    p = _patched(ADMIN_TARGET, [2, 0], db)
    with p[0], p[1], p[2], p[3], p[4], p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.update_role("u-2", "editor", actor_id="u-1")
    written = [c.args[0]["role"] for c in roles_table.update.call_args_list]
    assert written == ["editor", "admin"]


def test_concurrent_suspension_race_restores_profile_and_unbans(db):
    p = _patched(ADMIN_TARGET, [2, 0], db)
    with p[0], p[1], p[2], p[3] as ban, p[4] as profile, p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.update_status("u-2", "suspended", actor_id="u-1")
    assert [c.kwargs["banned"] for c in ban.call_args_list] == [True, False]
    assert [c.args[1] for c in profile.call_args_list] == [
        {"status": "suspended"},
        {"status": "active"},
    ]


def test_concurrent_delete_race_restores_profile(db):
    p = _patched(ADMIN_TARGET, [2, 0], db)
    with p[0], p[1], p[2], p[3], p[4] as profile, p[5]:
        with pytest.raises(user_service.LastAdminError):
            user_service.soft_delete_user("u-2", actor_id="u-1")
    restored = profile.call_args_list[-1].args[1]
    assert restored == {"status": "active", "deleted_at": None}


# --- role assignment for a role-less user (maybe_single regression) --------------


def test_assigning_first_role_to_role_less_user_inserts(db, roles_table):
    roles_table.execute.return_value = MagicMock(data=[])
    target = {"id": "u-3", "email": "c@example.com", "role": None, "status": "active"}
    p = _patched(target, [], db)
    with p[0], p[1], p[2], p[3], p[4], p[5]:
        user_service.update_role("u-3", "editor", actor_id="u-1")
    inserted = roles_table.insert.call_args.args[0]
    assert inserted["user_id"] == "u-3"
    assert inserted["role"] == "editor"
    roles_table.update.assert_not_called()


# --- _count_active_admins only counts usable admins ------------------------------


def test_count_active_admins_filters_by_status_and_deleted():
    roles = MagicMock()
    roles.select.return_value = roles
    roles.eq.return_value = roles
    roles.execute.return_value = MagicMock(data=[{"user_id": "a"}, {"user_id": "b"}])
    profiles = MagicMock()
    for method in ("select", "in_", "eq", "is_"):
        getattr(profiles, method).return_value = profiles
    profiles.execute.return_value = MagicMock(data=[{"id": "a"}])
    client = MagicMock()
    client.table.side_effect = lambda name: {"user_roles": roles, "profiles": profiles}[name]
    with patch("services.user_service.get_supabase_client", return_value=client):
        assert user_service._count_active_admins() == 1
    profiles.eq.assert_called_with("status", "active")
    profiles.is_.assert_called_with("deleted_at", "null")


# --- HTTP mapping -----------------------------------------------------------------

ADMIN_ACTOR = AuthUser(id="u-1", email="a@example.com", role="admin", status="active")


@pytest.fixture
def client():
    return create_app().test_client()


def test_self_role_change_route_is_400(client):
    with patch("routes.user_routes.require_admin", return_value=(ADMIN_ACTOR, None)):
        response = client.patch("/api/users/u-1/role", json={"role": "editor"})
    assert response.status_code == 400


def test_self_status_change_route_is_400(client):
    with patch("routes.user_routes.require_admin", return_value=(ADMIN_ACTOR, None)):
        response = client.patch("/api/users/u-1/status", json={"status": "suspended"})
    assert response.status_code == 400


def test_self_delete_route_is_still_400(client):
    with patch("routes.user_routes.require_admin", return_value=(ADMIN_ACTOR, None)):
        response = client.delete("/api/users/u-1")
    assert response.status_code == 400


def test_last_admin_route_is_409(client):
    with (
        patch("routes.user_routes.require_admin", return_value=(ADMIN_ACTOR, None)),
        patch(
            "routes.user_routes.user_service.update_role",
            side_effect=user_service.LastAdminError(user_service.MSG_LAST_ADMIN),
        ),
    ):
        response = client.patch("/api/users/u-2/role", json={"role": "viewer"})
    assert response.status_code == 409
    assert response.get_json()["code"] == "last_admin"
