"""Static guards over supabase/migrations for the RBAC hardening.

No database is available in CI, so these parse the SQL text. They pin the
properties the 20261006 migration relies on; the behavioral checks live in
supabase/checks/20261006_rbac_hardening_checks.sql (run on a branch DB).
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

MIGRATIONS = Path(__file__).resolve().parents[2] / "supabase" / "migrations"
HARDENING = MIGRATIONS / "20261006000000_harden_profiles_and_role_checks.sql"


def _strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


def _all_sql() -> list[tuple[str, str]]:
    return [(p.name, _strip_comments(p.read_text(encoding="utf-8"))) for p in sorted(MIGRATIONS.glob("*.sql"))]


def _policies(sql: str):
    """Yield (name, target, body) for every static CREATE POLICY."""
    for m in re.finditer(
        r"CREATE POLICY\s+(\w+)\s+ON\s+([\w.]+)(.*?);", sql, re.IGNORECASE | re.DOTALL
    ):
        yield m.group(1), m.group(2), " ".join(m.group(3).split())


def test_no_later_migration_redefines_has_role():
    """The hardened has_role() (status / deleted_at checks) must stay the
    effective definition. Later migrations may add policies that call it,
    but must not redefine or drop it."""
    assert HARDENING.exists()
    for name, sql in _all_sql():
        if name <= HARDENING.name:
            continue
        assert not re.search(r"FUNCTION\s+public\.has_role\b", sql, re.IGNORECASE), name


def test_has_role_requires_active_non_deleted_profile():
    sql = _strip_comments(HARDENING.read_text(encoding="utf-8"))
    fn = re.search(
        r"CREATE OR REPLACE FUNCTION public\.has_role\(.*?\$\$(.*?)\$\$", sql, re.DOTALL
    )
    assert fn, "has_role must be redefined"
    body = " ".join(fn.group(1).split())
    assert "JOIN public.profiles p ON p.id = ur.user_id" in body
    assert "p.status = 'active'" in body
    assert "p.deleted_at IS NULL" in body
    assert "SECURITY DEFINER" in sql


def test_profiles_insert_update_revoked_without_column_grants():
    sql = _strip_comments(HARDENING.read_text(encoding="utf-8"))
    assert re.search(r"REVOKE INSERT, UPDATE ON TABLE public\.profiles FROM authenticated", sql)
    assert re.search(r"REVOKE INSERT, UPDATE ON TABLE public\.profiles FROM anon", sql)
    # No column-level (or any) INSERT/UPDATE grant back on profiles.
    assert not re.search(r"GRANT[^;]*(INSERT|UPDATE)[^;]*ON[^;]*profiles", sql, re.IGNORECASE)


def test_no_later_migration_regrants_profiles_writes():
    for name, sql in _all_sql():
        if name <= HARDENING.name:
            continue
        assert not re.search(
            r"GRANT[^;]*(INSERT|UPDATE|ALL)[^;]*ON[^;]*profiles[^;]*TO[^;]*(authenticated|anon)",
            sql,
            re.IGNORECASE,
        ), name


def test_only_has_role_function_reads_user_roles():
    """Any SQL function touching user_roles must be has_role (the single
    choke point that now checks status) — otherwise it would bypass the
    suspension check."""
    offenders = []
    for name, sql in _all_sql():
        for fn in re.finditer(
            r"CREATE (?:OR REPLACE )?FUNCTION\s+([\w.]+)\(.*?\$\$(.*?)\$\$", sql, re.DOTALL
        ):
            if "user_roles" in fn.group(2) and fn.group(1) != "public.has_role":
                offenders.append((name, fn.group(1)))
    assert offenders == []


def test_policies_reference_user_roles_only_on_user_roles_itself():
    """Outside the user_roles table's own policies, no policy may read
    user_roles directly (it must go through has_role)."""
    offenders = []
    for name, sql in _all_sql():
        for policy, target, body in _policies(sql):
            if target != "public.user_roles" and "user_roles" in body:
                offenders.append((name, policy))
    assert offenders == []


def test_dynamic_policy_templates_use_has_role():
    """Policies created via EXECUTE format(...) loops must authorize through
    has_role too."""
    for name, sql in _all_sql():
        for tmpl in re.findall(r"'CREATE POLICY %I ON public\.%I (.*?)'\s*,", sql, re.DOTALL):
            assert "has_role" in tmpl, (name, tmpl)


@pytest.mark.parametrize("cmd", ["INSERT", "UPDATE", "DELETE"])
def test_storage_write_policies_all_go_through_has_role(cmd):
    """Every storage.objects write policy must be gated by has_role (the
    avatars bucket additionally allows the owner's own folder)."""
    found = 0
    for _, sql in _all_sql():
        for policy, target, body in _policies(sql):
            if target != "storage.objects" or f"FOR {cmd}" not in body.upper():
                continue
            found += 1
            assert "has_role" in body, policy
    assert found > 0


def test_storage_read_without_has_role_is_public_buckets_only():
    public_buckets = {"avatars", "gallery", "posts", "settings-assets"}
    for _, sql in _all_sql():
        for policy, target, body in _policies(sql):
            if target != "storage.objects" or "FOR SELECT" not in body.upper():
                continue
            if "has_role" in body:
                continue
            bucket = re.search(r"bucket_id = '([\w-]+)'", body)
            assert bucket and bucket.group(1) in public_buckets, policy


def _effective_storage_policies() -> dict[str, str]:
    """Replay storage.objects policy DROP / CREATE across all migrations in
    order and return the final {policy name: normalized body}."""
    effective: dict[str, str] = {}
    pattern = re.compile(
        r"DROP POLICY IF EXISTS\s+(\w+)\s+ON\s+storage\.objects\s*;"
        r"|CREATE POLICY\s+(\w+)\s+ON\s+storage\.objects(.*?);",
        re.IGNORECASE | re.DOTALL,
    )
    for _, sql in _all_sql():
        for m in pattern.finditer(sql):
            if m.group(1):
                effective.pop(m.group(1), None)
            else:
                effective[m.group(2)] = " ".join(m.group(3).split())
    return effective


def _bucket_policies(bucket: str, cmd: str) -> dict[str, list[str]]:
    """{policy: roles passed to has_role} for one bucket and command."""
    found: dict[str, list[str]] = {}
    for policy, body in _effective_storage_policies().items():
        if f"bucket_id = '{bucket}'" not in body or f"FOR {cmd}" not in body.upper():
            continue
        roles = re.search(r"has_role\(ARRAY\[([^\]]*)\]", body)
        found[policy] = re.findall(r"'(\w+)'", roles.group(1)) if roles else []
    return found


# Private buckets whose Storage read must match their editor-only APIs:
# contact attachments (contacts API) and sponsor files (sponsors API).
EDITOR_ONLY_BUCKETS = ["attachments", "sponsor-files"]


@pytest.mark.parametrize("bucket", EDITOR_ONLY_BUCKETS)
def test_viewer_cannot_read_editor_only_bucket(bucket):
    select = _bucket_policies(bucket, "SELECT")
    assert select, "admin/editor must keep a read policy"
    for policy, roles in select.items():
        assert "viewer" not in roles, policy
        assert {"admin", "editor"} <= set(roles), policy


@pytest.mark.parametrize("bucket", EDITOR_ONLY_BUCKETS)
def test_editor_only_bucket_write_policies_unchanged(bucket):
    assert list(_bucket_policies(bucket, "INSERT").values()) == [["admin", "editor"]]
    assert list(_bucket_policies(bucket, "UPDATE").values()) == [["admin", "editor"]]
    assert list(_bucket_policies(bucket, "DELETE").values()) == [["admin"]]


def test_signup_trigger_function_is_security_definer():
    """REVOKE INSERT on profiles must not break profile creation: the
    on_auth_user_created trigger runs handle_new_user as its owner."""
    init = _strip_comments((MIGRATIONS / "20260315000000_init.sql").read_text(encoding="utf-8"))
    fn = re.search(
        r"CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)(.*?)AS \$\$", init, re.DOTALL
    )
    assert fn and "SECURITY DEFINER" in fn.group(1)
    assert "EXECUTE FUNCTION public.handle_new_user()" in init
