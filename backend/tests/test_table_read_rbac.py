"""Who can read the sensitive tables directly (PostgREST + anon key)?

No database is available in CI, so this replays every migration in order
— static DROP / CREATE POLICY statements and the `FOREACH t IN ARRAY
tables` loops that build "<table>_select" policies via EXECUTE format —
to get the effective SELECT policies, then evaluates them for each role.
Behavioral checks on a real DB: supabase/checks/20261008_table_read_checks.sql.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

MIGRATIONS = Path(__file__).resolve().parents[2] / "supabase" / "migrations"
SENSITIVE = MIGRATIONS / "20261008000002_restrict_sensitive_table_reads.sql"

_STATIC_DROP = re.compile(r"DROP POLICY IF EXISTS\s+(\w+)\s+ON\s+public\.(\w+)\s*;", re.I)
_STATIC_CREATE = re.compile(r"CREATE POLICY\s+(\w+)\s+ON\s+public\.(\w+)(.*?);", re.I | re.S)
_DO_BLOCK = re.compile(r"DO \$\$(.*?)END \$\$;", re.S)
_LOOP_TABLES = re.compile(r"tables\s+TEXT\[\]\s*:=\s*ARRAY\[(.*?)\];", re.S)
_LOOP_DROP = re.compile(
    r"EXECUTE format\(\s*'DROP POLICY IF EXISTS %I ON public\.%I',\s*t \|\| '_(\w+)'"
)
_LOOP_CREATE = re.compile(
    r"EXECUTE format\(\s*'CREATE POLICY %I ON public\.%I (.*?)',\s*t \|\| '_(\w+)'", re.S
)


def _strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


def _effective_policies(*, skip: str | None = None) -> dict[tuple[str, str], str]:
    """{(table, policy): normalized body} after replaying all migrations
    (optionally without the migration file named `skip`)."""
    events: list[tuple[str, int, str, str, str, str | None]] = []
    for path in sorted(MIGRATIONS.glob("*.sql")):
        if path.name == skip:
            continue
        sql = _strip_comments(path.read_text(encoding="utf-8"))
        for m in _STATIC_DROP.finditer(sql):
            events.append((path.name, m.start(), "drop", m.group(2), m.group(1), None))
        for m in _STATIC_CREATE.finditer(sql):
            events.append((path.name, m.start(), "create", m.group(2), m.group(1), m.group(3)))
        for block in _DO_BLOCK.finditer(sql):
            tables = _LOOP_TABLES.search(block.group(1))
            if not tables:
                continue
            names = re.findall(r"'(\w+)'", tables.group(1))
            pos = block.start()
            for table in names:
                for m in _LOOP_DROP.finditer(block.group(1)):
                    events.append((path.name, pos, "drop", table, f"{table}_{m.group(1)}", None))
                for m in _LOOP_CREATE.finditer(block.group(1)):
                    body = m.group(1).replace("''", "'")
                    events.append(
                        (path.name, pos + 1, "create", table, f"{table}_{m.group(2)}", body)
                    )
    effective: dict[tuple[str, str], str] = {}
    for _, _, kind, table, policy, body in sorted(events, key=lambda e: (e[0], e[1])):
        if kind == "drop":
            effective.pop((table, policy), None)
        else:
            effective[(table, policy)] = " ".join((body or "").split())
    return effective


def _select_bodies(table: str, effective: dict | None = None) -> list[str]:
    effective = effective if effective is not None else _effective_policies()
    return [
        body
        for (t, _), body in effective.items()
        if t == table and re.search(r"\bFOR SELECT\b", body, re.I)
    ]


def _using(body: str) -> str:
    m = re.search(r"\bUSING\s*\((.*)\)\s*$", body, re.S)
    assert m, f"no USING clause: {body}"
    return m.group(1)


def _can_read(table: str, role: str | None, *, own_row: bool) -> bool:
    """Evaluate the effective SELECT policies for a signed-in user with
    `role` (None = no CMS role) reading their own row or someone else's.
    Only understands has_role(...), auth.uid() = <col> and TRUE, and fails
    loudly on anything else so the evaluator never guesses."""
    for body in _select_bodies(table):
        expr = _using(body)
        rest = expr
        allowed = False
        for m in re.finditer(r"public\.has_role\(ARRAY\[([^\]]*)\]::public\.app_role\[\]\)", expr):
            if role in re.findall(r"'(\w+)'", m.group(1)):
                allowed = True
            rest = rest.replace(m.group(0), "")
        for m in re.finditer(r"auth\.uid\(\) = (?:id|user_id)", expr):
            allowed = allowed or own_row
            rest = rest.replace(m.group(0), "")
        if re.fullmatch(r"\s*\(?\s*TRUE\s*\)?\s*", expr, re.I):
            allowed = True
            rest = ""
        assert re.fullmatch(r"[\s()]*(OR[\s()]*)*", rest, re.I), f"unexpected USING: {expr}"
        if allowed:
            return True
    return False


ROLES = ["admin", "editor", "viewer", None]


# --- contacts / sponsors: admin + editor only --------------------------------------


@pytest.mark.parametrize("table", ["contacts", "sponsors"])
@pytest.mark.parametrize(
    ("role", "expected"),
    [("admin", True), ("editor", True), ("viewer", False), (None, False)],
)
def test_contacts_and_sponsors_readable_by_admin_and_editor_only(table, role, expected):
    assert _can_read(table, role, own_row=False) is expected


# --- profiles / user_roles: own row for everyone, all rows admin only ------------


@pytest.mark.parametrize("table", ["profiles", "user_roles"])
@pytest.mark.parametrize("role", ROLES)
def test_everyone_signed_in_can_read_own_profile_and_role_row(table, role):
    assert _can_read(table, role, own_row=True) is True


@pytest.mark.parametrize("table", ["profiles", "user_roles"])
@pytest.mark.parametrize(
    ("role", "expected"),
    [("admin", True), ("editor", False), ("viewer", False), (None, False)],
)
def test_other_users_rows_readable_by_admin_only(table, role, expected):
    assert _can_read(table, role, own_row=False) is expected


# --- scope guards -------------------------------------------------------------------

TOUCHED = {
    ("contacts", "contacts_select"),
    ("sponsors", "sponsors_select"),
    ("profiles", "profiles_select"),
    ("user_roles", "user_roles_select"),
}


def test_migration_only_replaces_the_four_select_policies():
    sql = _strip_comments(SENSITIVE.read_text(encoding="utf-8"))
    dropped = {(m.group(2), m.group(1)) for m in _STATIC_DROP.finditer(sql)}
    created = {(m.group(2), m.group(1)) for m in _STATIC_CREATE.finditer(sql)}
    assert dropped == TOUCHED
    assert created == TOUCHED
    assert "GRANT" not in sql.upper() and "REVOKE" not in sql.upper()
    assert "FUNCTION" not in sql.upper()


def test_no_other_policy_changes_versus_before_this_migration():
    before = _effective_policies(skip=SENSITIVE.name)
    after = _effective_policies()
    assert set(before) == set(after)
    changed = {key for key in after if before[key] != after[key]}
    assert changed == TOUCHED


def test_these_policies_were_viewer_readable_before():
    """Guards the evaluator itself: without the migration, viewers could
    read every row of all four tables."""
    before = _effective_policies(skip=SENSITIVE.name)
    for table in ("contacts", "sponsors", "profiles", "user_roles"):
        bodies = _select_bodies(table, before)
        assert any("'viewer'" in body for body in bodies), table
