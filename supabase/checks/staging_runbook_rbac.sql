-- 注意: この手順書は staging では未検証（一度も実行していない）。
-- =============================================================================
-- STAGING RUNBOOK — RBAC hardening (A-1 / A-2 / A-4 / A-7)
-- Target migration: supabase/migrations/20261006000000_harden_profiles_and_role_checks.sql
-- Companion checks: supabase/checks/20261006_rbac_hardening_checks.sql (PART A / PART B)
--
-- NOT a migration. The Supabase CLI never runs files in supabase/checks/.
-- Run it section by section, by hand, in the Supabase SQL editor of a
-- FRESH STAGING PROJECT. NEVER run this whole file at once.
--
-- Sections marked [READ-ONLY] are safe anywhere (including production).
-- Sections marked [STAGING-WRITE] change staging data. Every one of them
-- starts with a GUARD that raises unless the three staging-only test users
-- below exist — production does not have them, so the guard stops a
-- mistaken run there.
--
--   Test users (create them in the Dashboard, step 2):
--     ljf-rbac-admin@example.com      -> admin role
--     ljf-rbac-editor@example.com     -> editor role
--     ljf-rbac-recovery@example.com   -> NO role (A-4 recovery rehearsal only)
--
-- =============================================================================
-- 0. EXECUTION ORDER (do not reorder)
-- =============================================================================
--
--   1. Apply migrations 1-21, ONE BY ONE, in filename order
--        20260315000000_init.sql
--        ... (see list below) ...
--        20260925000000_admin_login_lockout.sql
--      A fresh staging project has no profiles / user_roles / has_role() /
--      profiles.status until these run: S0 and S1 cannot run before them.
--      DO NOT apply migration 22 yet. Do not run supabase/seeds/* (the seed
--      requires public.update_timestamp(), which no migration creates).
--   2. Create the three test users (Dashboard > Authentication > Users)
--   3. T1-T5  test data (user_roles, contacts, settings check, optional PDF)
--   4. S0     environment + precondition checks          [READ-ONLY]
--   5. S1     schema checks                              [READ-ONLY]
--   6. (optional) BEFORE migration 22:
--        PART A                      — A4 / A7 differ from "after" (expected)
--        PART B, block B1 only       — B1a MUST FAIL (expected, see P1)
--   7. Apply migration 22: 20261006000000_harden_profiles_and_role_checks.sql
--   8. PART A (after)  — A9, A10, A11 must all be OK
--   9. PART B          — B1 ... B5 (companion file), then B6 (this file)
--  10. R0-R6           — A-4 admin recovery rehearsal on the recovery user
--  11. SCHEMA INVENTORY [READ-ONLY] on staging AND production, diff the output
--
--   Migrations 1-21 (apply in exactly this order):
--     01 20260315000000_init.sql
--     02 20260315000001_videos_youtube_cms.sql
--     03 20260315000002_blog_cms.sql
--     04 20260315000003_contacts_cms.sql
--     05 20260315000004_family_gallery_cms.sql
--     06 20260315000005_sponsors_cms.sql
--     07 20260315000006_analytics_ga4.sql
--     08 20260315000007_rbac_users_audit.sql
--     09 20260315000008_site_settings.sql
--     10 20260315000009_family_profiles_enrich.sql
--     11 20260315000010_announcements_cms.sql
--     12 20260315000011_announcements_i18n.sql
--     13 20260315000012_announcement_schedule_and_banners.sql
--     14 20260315000013_gallery_categories_recommended.sql
--     15 20260315000014_settings_official_social.sql
--     16 20260331000000_strip_cms_from_site_description.sql
--     17 20260331000001_cms_i18n_fields.sql
--     18 20260908000000_settings_assets_remove_svg.sql
--     19 20260909000000_gallery_location_i18n.sql
--     20 20260914000000_settings_maintenance_message.sql
--     21 20260925000000_admin_login_lockout.sql
--   Migration 22 (step 7 only):
--     22 20261006000000_harden_profiles_and_role_checks.sql
--
--   Note: migrations pasted into the SQL editor are NOT recorded in
--   supabase_migrations.schema_migrations (only the CLI records them). Use
--   SCHEMA INVENTORY to compare structure regardless.
--
-- =============================================================================
-- IMPORTANT: staging success != production schema
-- =============================================================================
--
--   "Migrations applied cleanly on staging"  is NOT  "production has the same
--   schema". Production may contain objects that no migration creates — e.g.
--   public.update_timestamp(), which supabase/seeds/first_official_announcement.sql
--   requires. Before any production decision, run on PRODUCTION (read-only):
--     SCHEMA INVENTORY, S0, S1, PART A, and SCHEMA INVENTORY-M (schema_migrations,
--     if the table exists)
--   and diff against staging. For every difference, decide whether it touches
--   this change: has_role(), profiles privileges, user_roles, RLS policies,
--   storage policies, the signup trigger. Only then decide on production.
--
-- =============================================================================
-- Rules while running
-- =============================================================================
--   * Run one block at a time (BEGIN ... COMMIT/ROLLBACK as a unit).
--   * If a block errors: run ROLLBACK; immediately, record block / line /
--     full error text / that ROLLBACK succeeded, and stop. Do not start the
--     next BEGIN on top of an aborted transaction.
--   * A NOTICE starting with SKIP or N/A is NOT a PASS. Record it as such.
-- =============================================================================


-- =============================================================================
-- STEP 2 — Test users (Dashboard, not SQL)
-- =============================================================================
--   Dashboard > Authentication > Users > Add user > Create new user
--     email: ljf-rbac-admin@example.com     password: <random>  [x] Auto Confirm User
--     email: ljf-rbac-editor@example.com    password: <random>  [x] Auto Confirm User
--     email: ljf-rbac-recovery@example.com  password: <random>  [x] Auto Confirm User
--   The signup trigger (public.handle_new_user) creates each profiles row.
--   Do NOT give the recovery user an admin/editor role.


-- =============================================================================
-- T1 [READ-ONLY] — Test user UUIDs and auto-created profiles
-- =============================================================================
-- Expect 3 rows, has_profile = true, status = 'active', deleted_at NULL,
-- role NULL for all three (no roles yet).
SELECT u.email,
       u.id                AS user_uuid,
       p.id IS NOT NULL    AS has_profile,
       p.status,
       p.deleted_at,
       r.role,
       u.banned_until
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN ('ljf-rbac-admin@example.com',
                  'ljf-rbac-editor@example.com',
                  'ljf-rbac-recovery@example.com')
ORDER BY u.email COLLATE "C";


-- =============================================================================
-- T2 [STAGING-WRITE] — user_roles for admin / editor (by the UUIDs from T1)
-- =============================================================================
-- Schema-agnostic (does not rely on ON CONFLICT (user_id), which S1 has not
-- verified yet). Idempotent. The recovery user gets NO role.
BEGIN;
DO $$
DECLARE
  admin_id    uuid;
  editor_id   uuid;
  recovery_id uuid;
BEGIN
  -- GUARD: only on a project that has the staging test users.
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;

  SELECT id INTO admin_id    FROM auth.users WHERE email = 'ljf-rbac-admin@example.com';
  SELECT id INTO editor_id   FROM auth.users WHERE email = 'ljf-rbac-editor@example.com';
  SELECT id INTO recovery_id FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id IN (admin_id, editor_id, recovery_id)
                 HAVING count(*) = 3) THEN
    RAISE EXCEPTION 'T2: a test user has no profiles row (signup trigger missing?)';
  END IF;

  UPDATE public.user_roles SET role = 'admin'  WHERE user_id = admin_id;
  INSERT INTO public.user_roles (user_id, role)
    SELECT admin_id, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_id);

  UPDATE public.user_roles SET role = 'editor' WHERE user_id = editor_id;
  INSERT INTO public.user_roles (user_id, role)
    SELECT editor_id, 'editor'
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = editor_id);

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = recovery_id) THEN
    RAISE EXCEPTION 'T2: recovery user must have NO role — remove it first';
  END IF;

  RAISE NOTICE 'T2 OK: admin=% editor=% (recovery % has no role)', admin_id, editor_id, recovery_id;
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;


-- =============================================================================
-- T3 [STAGING-WRITE] — one protected contacts row (PART B positive tests)
-- =============================================================================
-- Required columns without defaults: contact_name, email, subject, message.
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  INSERT INTO public.contacts (contact_name, email, subject, message)
  SELECT 'LJF RBAC staging', 'ljf-rbac-contact@example.com',
         'LJF-RBAC-STAGING-TEST', 'Row for PART B positive/negative checks.'
  WHERE NOT EXISTS (SELECT 1 FROM public.contacts WHERE subject = 'LJF-RBAC-STAGING-TEST');
  RAISE NOTICE 'T3 OK: contacts rows = %', (SELECT count(*) FROM public.contacts);
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;


-- =============================================================================
-- T4 [READ-ONLY] — settings initial row (created by migrations 01 and 09)
-- =============================================================================
-- Expect settings_rows >= 1 (needed by PART B / B5). No insert required.
SELECT count(*) AS settings_rows FROM public.settings;


-- =============================================================================
-- T5 (optional, Dashboard) — attachments test PDF for B2 storage checks
-- =============================================================================
--   Dashboard > Storage > attachments > Upload: a small PDF to
--     rbac-staging-test/ljf-rbac-test.pdf
--   (bucket allows PDF / JPEG / PNG / WEBP up to 20 MB). Without it, B2's
--   storage part can only report SKIP, which is NOT a pass.
--
-- T-ROLLBACK (only if you need to undo T2/T3 later):
--   DELETE FROM public.contacts WHERE subject = 'LJF-RBAC-STAGING-TEST';
--   Deleting the three test users in the Dashboard removes their profiles
--   and user_roles rows (ON DELETE CASCADE).


-- =============================================================================
-- S0 [READ-ONLY] — Environment and preconditions
-- =============================================================================

-- S0-1 Who runs the SQL; can that role SET ROLE authenticated / anon?
--      PART B needs session_user to be a member of authenticated and anon
--      (PG16+: membership with the SET option).
SELECT version() AS server_version,
       session_user,
       current_user,
       r.rolsuper,
       r.rolbypassrls,
       pg_has_role(session_user, 'authenticated', 'MEMBER') AS member_of_authenticated,
       pg_has_role(session_user, 'anon', 'MEMBER')          AS member_of_anon
FROM pg_roles r
WHERE r.rolname = session_user;
-- PG16+ only (errors on <= 15 — then skip):
-- SELECT pg_has_role(session_user, 'authenticated', 'SET') AS can_set_authenticated,
--        pg_has_role(session_user, 'anon', 'SET')          AS can_set_anon;

-- S0-2 What auth.uid() reads. PART B sets both request.jwt.claim.sub and
--      request.jwt.claims and asserts auth.uid() = expected after each switch.
SELECT pg_get_functiondef('auth.uid()'::regprocedure);

-- S0-3 PART B preconditions. Need: active_editors >= 1, active_admins >= 1,
--      contacts >= 1, settings >= 1, recovery user present with no role.
SELECT
  (SELECT count(*) FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role = 'editor' AND p.status = 'active' AND p.deleted_at IS NULL) AS active_editors,
  (SELECT count(*) FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role = 'admin'  AND p.status = 'active' AND p.deleted_at IS NULL) AS active_admins,
  (SELECT count(*) FROM public.contacts) AS contacts_rows_seen_by_session_user,
  (SELECT count(*) FROM public.settings) AS settings_rows_seen_by_session_user,
  (SELECT count(*) FROM auth.users u
    WHERE u.email = 'ljf-rbac-recovery@example.com'
      AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)) AS recovery_user_without_role;

-- S0-4 Does the session user see ALL rows (owner / bypassrls)? PART B counts
--      preconditions as the session user; if it is neither the table owner
--      nor BYPASSRLS, those counts are RLS-filtered and misleading.
SELECT c.oid::regclass AS tbl,
       pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) = session_user AS session_user_is_owner
FROM pg_class c
WHERE c.oid IN ('public.contacts'::regclass, 'public.settings'::regclass,
                'public.profiles'::regclass, 'public.user_roles'::regclass,
                'storage.objects'::regclass)
ORDER BY c.oid::regclass::text COLLATE "C";

-- S0-5 Storage classification for B2 — decide BEFORE running PART B:
SELECT id, public FROM storage.buckets WHERE id = 'attachments';          -- (a)
SELECT count(*) AS attachments_seen_by_session_user
FROM storage.objects WHERE bucket_id = 'attachments';                      -- (b)/(c)
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND qual ILIKE '%attachments%'
ORDER BY policyname COLLATE "C";                                           -- (d)
--   Classify (record exactly one):
--   (a) BUCKET MISSING   S0-5a returns 0 rows.
--   (b) BUCKET EMPTY     bucket exists, Dashboard > Storage > attachments
--                        shows no files, and count = 0.
--   (c) NOT VISIBLE      Dashboard shows files but count = 0 (session user is
--                        RLS-filtered on storage.objects, see S0-4). B2's
--                        "SKIP ... bucket is empty" would be WRONG here.
--   (d) NO READ POLICY   ljf_attachments_auth_read is absent: editor cannot
--                        read attachments by design on this DB; B2 storage
--                        positive would fail for a design reason — stop and
--                        report, do not edit the test.
--   Only when the bucket exists, files are visible to the session user and
--   the policy exists does B2 assert storage. Any other case is
--   "STORAGE NOT VERIFIED", never PASS.

-- S0-6 Table privileges PART B relies on (RLS aside).
SELECT
  has_table_privilege('authenticated', 'public.contacts',   'SELECT') AS auth_select_contacts,
  has_table_privilege('authenticated', 'public.user_roles', 'SELECT') AS auth_select_user_roles,
  has_table_privilege('authenticated', 'public.profiles',   'SELECT') AS auth_select_profiles,
  has_table_privilege('authenticated', 'storage.objects',   'SELECT') AS auth_select_objects,
  has_table_privilege('anon',          'public.settings',   'SELECT') AS anon_select_settings;


-- =============================================================================
-- S1 [READ-ONLY] — Schema checks (recovery SQL + has_role prerequisites)
-- =============================================================================

-- S1-1 user_roles constraints. Migrations define PK (id), UNIQUE
--      user_roles_user_id_unique (user_id), CHECK role, FK user_roles_profile_fk
--      (may be absent: added in an error-swallowing DO block).
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
ORDER BY contype, conname COLLATE "C";

SELECT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid = 'public.user_roles'::regclass
    AND contype IN ('u', 'p')
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'public.user_roles'::regclass
                           AND attname = 'user_id')]::int2[]
) AS on_conflict_user_id_supported;

SELECT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid = 'public.user_roles'::regclass AND conname = 'user_roles_profile_fk'
) AS user_roles_profile_fk_exists;   -- decides B6: true => orphans impossible (N/A)

-- S1-2 Columns used by recovery / tests.
SELECT table_schema, table_name, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE (table_schema, table_name, column_name) IN (
  ('public', 'user_roles', 'id'),
  ('public', 'user_roles', 'user_id'),
  ('public', 'user_roles', 'role'),
  ('public', 'user_roles', 'created_at'),
  ('public', 'user_roles', 'updated_at'),
  ('public', 'profiles',   'status'),
  ('public', 'profiles',   'deleted_at'),
  ('public', 'profiles',   'updated_at'),
  ('public', 'audit_logs', 'user_id'),
  ('public', 'audit_logs', 'action'),
  ('public', 'audit_logs', 'target_type'),
  ('public', 'audit_logs', 'target_id'),
  ('public', 'audit_logs', 'meta'),
  ('auth',   'users',      'banned_until')
)
ORDER BY table_schema COLLATE "C", table_name COLLATE "C", column_name COLLATE "C";

-- S1-3 updated_at triggers on profiles / user_roles.
SELECT tgrelid::regclass AS tbl, tgname
FROM pg_trigger
WHERE tgrelid IN ('public.profiles'::regclass, 'public.user_roles'::regclass)
  AND NOT tgisinternal
ORDER BY tgrelid::regclass::text COLLATE "C", tgname COLLATE "C";

-- S1-4 Orphan roles (user_roles without profile) — silently denied after
--      migration 22. Expect 0 rows.
SELECT r.user_id, r.role
FROM public.user_roles r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE p.id IS NULL
ORDER BY r.user_id;


-- =============================================================================
-- P1 (optional) — BEFORE migration 22: prove the checks detect the problem
-- =============================================================================
--   Run from supabase/checks/20261006_rbac_hardening_checks.sql:
--     * PART A — expected BEFORE migration 22:
--         A4  checks_status = false        (old has_role ignores status)
--         A7  rows for authenticated/anon INSERT/UPDATE on profiles
--         A9/A10/A11 should already be OK (owner / FORCE RLS / signature)
--     * PART B, block B1 ONLY — expected BEFORE migration 22:
--         ERROR  FAIL B1a: authenticated could UPDATE profiles
--       This FAIL is CORRECT: it shows the test detects the self-update hole
--       that migration 22 closes. The transaction is aborted — run
--       ROLLBACK; right away (the UPDATE is undone). Do not run B2-B5 yet.


-- =============================================================================
-- STEP 7 — Apply migration 22
-- =============================================================================
--   supabase/migrations/20261006000000_harden_profiles_and_role_checks.sql
--   Then re-run S1-4 (orphans) before continuing.


-- =============================================================================
-- STEP 8 — PART A (after migration 22)
-- =============================================================================
--   From the companion file. Required: A9, A10, A11 all OK; A4 shows only
--   has_role with checks_status = true; A7 returns no rows; A5 / A6 as
--   documented there. Do not continue to production planning unless all OK.


-- =============================================================================
-- STEP 9 — PART B (after migration 22)
-- =============================================================================
--   From the companion file, one block at a time: B1, B2, B3, B4, B5.
--   Required outcomes:
--     B1  auth.uid() = expected; editor cannot UPDATE/INSERT profiles nor
--         self-promote in user_roles
--     B2  same editor: active sees >= 1 contacts -> suspended sees 0;
--         has_role(editor) true -> false
--     B3  same editor: active sees >= 1 -> soft-deleted sees 0
--     B4  active admin keeps access; direct profiles UPDATE denied
--     B5  anon: auth.uid() NULL, has_role false, settings readable, 0 contacts
--   Missing test users / empty contacts raise PRECONDITION errors by design.
--   Storage (B2): record per S0-5 — PASS only if both storage asserts ran;
--   any SKIP => "STORAGE NOT VERIFIED (a/b/c/d)".


-- =============================================================================
-- B6 [STAGING-WRITE, rolled back] — role without profile (orphan) is denied
-- =============================================================================
-- Uses the recovery user, temporarily given the editor role INSIDE this
-- transaction only (ROLLBACK at the end — it never keeps a role).
-- If user_roles_profile_fk exists (S1-1), deleting the profile cascades to
-- user_roles: an orphan cannot exist -> result is N/A (structurally
-- prevented), which must be recorded as N/A, not PASS.
BEGIN;
DO $$
DECLARE
  target uuid;
  n bigint;
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target
                   AND status = 'active' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'PRECONDITION B6: recovery user profile missing or not active';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target) THEN
    RAISE EXCEPTION 'PRECONDITION B6: recovery user already has a role';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n = 0 THEN
    RAISE EXCEPTION 'PRECONDITION B6: public.contacts is empty (run T3)';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target, 'editor');  -- txn-only
  PERFORM set_config('ljf.test_uid', target::text, true);
  PERFORM set_config('request.jwt.claim.sub', target::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target::text, 'role', 'authenticated')::text,
    true
  );
END $$;

-- B6 positive: role + profile -> access
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B6+: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF NOT public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B6+: editor (txn-only) has_role(editor) = false';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL B6+: editor sees 0 contacts (expected >= 1)';
  END IF;
  RAISE NOTICE 'OK B6+: role + profile -> has_role(editor), sees % contacts', n;
END $$;

-- remove the profile only (session user, this txn only)
SET LOCAL ROLE NONE;
DO $$
DECLARE
  target uuid := current_setting('ljf.test_uid')::uuid;
BEGIN
  DELETE FROM public.profiles WHERE id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL B6: could not delete the test profile';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target) THEN
    PERFORM set_config('ljf.b6_mode', 'orphan', true);
    RAISE NOTICE 'B6: user_roles row survived without profile (no cascading FK) -> testing orphan';
  ELSE
    PERFORM set_config('ljf.b6_mode', 'cascaded', true);
    RAISE NOTICE 'N/A B6: user_roles_profile_fk cascaded the delete — an orphan cannot exist';
  END IF;
END $$;

-- B6 negative: role WITHOUT profile -> no access
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B6-: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF current_setting('ljf.b6_mode') = 'cascaded' THEN
    RAISE NOTICE 'N/A B6-: orphan structurally prevented (record as N/A, not PASS)';
    RETURN;
  END IF;
  IF public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B6-: orphan role (no profile) still has_role(editor)';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL B6-: orphan role sees % contacts (expected 0)', n;
  END IF;
  RAISE NOTICE 'OK B6-: orphan role -> has_role false, 0 contacts';
END $$;
ROLLBACK;   -- always: restores the profile, removes the txn-only role


-- =============================================================================
-- R0-R6 — A-4 admin recovery rehearsal (recovery user ONLY)
-- =============================================================================
-- Safety conditions (each block enforces them):
--   * another ACTIVE admin (ljf-rbac-admin) must exist the whole time — the
--     active-admin count never reaches 0;
--   * only ljf-rbac-recovery@example.com is ever modified;
--   * the rehearsal ends by restoring the recovery user to its original
--     state (active, not deleted, NO role, not banned) and re-checking it.

-- R0 [STAGING-WRITE] — break the recovery user (suspended + deleted + no role)
BEGIN;
DO $$
DECLARE
  target uuid;
  others int;
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';
  SELECT count(*) INTO others
  FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL
    AND r.user_id <> target;
  IF others < 1 THEN
    RAISE EXCEPTION 'R0: no OTHER active admin — refusing to run the rehearsal';
  END IF;
  UPDATE public.profiles SET status = 'suspended', deleted_at = now() WHERE id = target;
  DELETE FROM public.user_roles WHERE user_id = target;
  RAISE NOTICE 'R0 OK: recovery user broken; other active admins = %', others;
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;

-- R0-ban — freeze the recovery user in Auth:
--   Primary:  Dashboard > Authentication > Users > ljf-rbac-recovery@example.com
--             > (row menu) "Ban user" if the Dashboard offers it.
--   Fallback (only if the Dashboard has no ban action):
--     UPDATE auth.users SET banned_until = now() + interval '100 years'
--     WHERE email = 'ljf-rbac-recovery@example.com';
--   Record which path you used.

-- R1 [READ-ONLY] — status, as an operator would check in a real incident
SELECT u.email, p.id, p.status, p.deleted_at, r.role, u.banned_until
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN ('ljf-rbac-admin@example.com',
                  'ljf-rbac-editor@example.com',
                  'ljf-rbac-recovery@example.com')
ORDER BY u.email COLLATE "C";
-- Expect recovery: status suspended, deleted_at set, role NULL, banned_until set.

-- R2 [STAGING-WRITE] — restore the recovery user as an active admin
--     Schema-agnostic (UPDATE + INSERT WHERE NOT EXISTS); verified before COMMIT.
BEGIN;
DO $$
DECLARE
  target uuid;
  n int;
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';

  UPDATE public.profiles SET status = 'active', deleted_at = NULL WHERE id = target;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'R2: profile not found (rows=%)', n;
  END IF;

  UPDATE public.user_roles SET role = 'admin' WHERE user_id = target;
  INSERT INTO public.user_roles (user_id, role)
    SELECT target, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target);
  -- updated_at columns are maintained by triggers (S1-3)

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = target AND r.role = 'admin'
      AND p.status = 'active' AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'R2: recovery user is not an active admin after restore';
  END IF;
  RAISE NOTICE 'R2 OK: recovery user restored as active admin';
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;

-- R3 [READ-ONLY] — active admin count (expect: other admins + 1, i.e. >= 2)
SELECT count(*) AS active_admins
FROM public.user_roles r
JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL;

-- R4 — lift the Auth ban
--   Primary:  Dashboard > Authentication > Users > ljf-rbac-recovery@example.com
--             > "Unban user" (if the Dashboard offers it).
--   Fallback (only if no such Dashboard action; S1-2 must show
--             auth.users.banned_until):
--     UPDATE auth.users SET banned_until = NULL
--     WHERE email = 'ljf-rbac-recovery@example.com';
--   Verify (expect banned_until NULL):
SELECT email, banned_until FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';

-- R5 [STAGING-WRITE] — audit trail of the recovery
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  INSERT INTO public.audit_logs (user_id, action, target_type, target_id, meta)
  SELECT NULL, 'ADMIN_RECOVERED_MANUALLY', 'user', u.id::text,
         jsonb_build_object('via', 'sql_editor', 'env', 'staging-rehearsal')
  FROM auth.users u WHERE u.email = 'ljf-rbac-recovery@example.com';
  RAISE NOTICE 'R5 OK: audit row written';
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;

-- R6 [STAGING-WRITE] — restore the recovery user's ORIGINAL state (no role)
--     Never removes the last active admin: requires another active admin.
BEGIN;
DO $$
DECLARE
  target uuid;
  others int;
BEGIN
  IF (SELECT count(*) FROM auth.users
      WHERE email IN ('ljf-rbac-admin@example.com',
                      'ljf-rbac-editor@example.com',
                      'ljf-rbac-recovery@example.com')) <> 3 THEN
    RAISE EXCEPTION 'GUARD: staging test users not found — is this really staging?';
  END IF;
  SELECT id INTO target FROM auth.users WHERE email = 'ljf-rbac-recovery@example.com';
  SELECT count(*) INTO others
  FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL
    AND r.user_id <> target;
  IF others < 1 THEN
    RAISE EXCEPTION 'R6: no OTHER active admin — not removing the recovery user''s role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = target;
  RAISE NOTICE 'R6 OK: recovery user back to no role; other active admins = %', others;
END $$;
COMMIT;   -- if the DO block raised: ROLLBACK;

-- R7 [READ-ONLY] — final re-check (expect recovery: active, deleted_at NULL,
--                  role NULL, banned_until NULL; admin + editor unchanged)
SELECT u.email, p.status, p.deleted_at, r.role, u.banned_until
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN ('ljf-rbac-admin@example.com',
                  'ljf-rbac-editor@example.com',
                  'ljf-rbac-recovery@example.com')
ORDER BY u.email COLLATE "C";

-- R-CLEANUP (optional): remove the rehearsal audit row
--   DELETE FROM public.audit_logs
--    WHERE action = 'ADMIN_RECOVERED_MANUALLY' AND meta->>'env' = 'staging-rehearsal';


-- =============================================================================
-- SCHEMA INVENTORY（読み取り専用・本番でも実行可）
-- =============================================================================
-- Run the SAME statements on production and staging, export each result
-- (CSV), and diff. Ordering is fixed (COLLATE "C") so diffs are stable.
-- Extension-owned functions are excluded (they differ by install, not by
-- our migrations). Works even when schema_migrations is empty / missing.

-- INV-1 Functions (public, storage)
SELECT n.nspname                                  AS schema,
       p.proname                                  AS function,
       pg_get_function_identity_arguments(p.oid)  AS arguments,
       p.prosecdef                                AS security_definer,
       pg_get_userbyid(p.proowner)                AS owner,
       coalesce((SELECT string_agg(cfg, ', ' ORDER BY cfg COLLATE "C")
                 FROM unnest(p.proconfig) AS cfg
                 WHERE cfg LIKE 'search_path=%'), '')   AS search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'storage')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d
                  WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
                    AND d.deptype = 'e')
ORDER BY n.nspname COLLATE "C", p.proname COLLATE "C",
         pg_get_function_identity_arguments(p.oid) COLLATE "C";

-- INV-2 Triggers (public, storage, auth — auth for the signup trigger)
SELECT n.nspname                 AS schema,
       c.relname                 AS "table",
       t.tgname                  AS trigger,
       CASE WHEN t.tgtype & 2  = 2  THEN 'BEFORE'
            WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
            ELSE 'AFTER' END     AS timing,
       concat_ws(' OR ',
         CASE WHEN t.tgtype & 4  = 4  THEN 'INSERT'   END,
         CASE WHEN t.tgtype & 8  = 8  THEN 'DELETE'   END,
         CASE WHEN t.tgtype & 16 = 16 THEN 'UPDATE'   END,
         CASE WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE' END) AS event,
       CASE WHEN t.tgtype & 1 = 1 THEN 'ROW' ELSE 'STATEMENT' END AS level,
       fn.nspname || '.' || f.proname AS function,
       t.tgenabled               AS enabled
FROM pg_trigger t
JOIN pg_class c      ON c.oid = t.tgrelid
JOIN pg_namespace n  ON n.oid = c.relnamespace
JOIN pg_proc f       ON f.oid = t.tgfoid
JOIN pg_namespace fn ON fn.oid = f.pronamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('public', 'storage', 'auth')
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C", t.tgname COLLATE "C";

-- INV-3 RLS policies (public, storage)
SELECT schemaname                         AS schema,
       tablename                          AS "table",
       policyname                         AS policy,
       cmd                                AS command,
       array_to_string(roles, ',')        AS roles,
       coalesce(qual, '')                 AS using_expr,
       coalesce(with_check, '')           AS with_check_expr
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname COLLATE "C", tablename COLLATE "C", policyname COLLATE "C";

-- INV-3b RLS enabled / forced per table (public, storage)
SELECT n.nspname AS schema, c.relname AS "table",
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname IN ('public', 'storage')
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C";

-- INV-4 Constraints (public)
SELECT n.nspname                  AS schema,
       c.relname                  AS "table",
       con.conname                AS constraint_name,
       CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'u' THEN 'UNIQUE'
                        WHEN 'f' THEN 'FOREIGN KEY' WHEN 'c' THEN 'CHECK'
                        WHEN 'x' THEN 'EXCLUDE'     WHEN 't' THEN 'TRIGGER'
                        ELSE con.contype::text END AS type,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c     ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C", con.conname COLLATE "C";

-- INV-5 Table privileges for authenticated / anon (public, storage)
SELECT table_schema   AS schema,
       table_name     AS "table",
       grantee,
       privilege_type AS privilege
FROM information_schema.role_table_grants
WHERE grantee IN ('authenticated', 'anon')
  AND table_schema IN ('public', 'storage')
ORDER BY table_schema COLLATE "C", table_name COLLATE "C",
         grantee COLLATE "C", privilege_type COLLATE "C";

-- INV-5b Column-level privileges for authenticated / anon (expect none on
--        public.profiles INSERT/UPDATE after migration 22)
SELECT table_schema AS schema, table_name AS "table", column_name,
       grantee, privilege_type AS privilege
FROM information_schema.column_privileges
WHERE grantee IN ('authenticated', 'anon')
  AND table_schema = 'public'
  AND privilege_type IN ('INSERT', 'UPDATE')
  AND (table_schema, table_name, grantee, privilege_type) NOT IN (
    SELECT table_schema, table_name, grantee, privilege_type
    FROM information_schema.role_table_grants)
ORDER BY table_schema COLLATE "C", table_name COLLATE "C",
         column_name COLLATE "C", grantee COLLATE "C", privilege_type COLLATE "C";

-- INV-M schema_migrations (only meaningful if the CLI applied migrations)
SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
       AS schema_migrations_exists;
-- If true, compare with the repository list (expected 22 versions once
-- migration 22 is applied; 21 before):
-- SELECT e.version AS expected_version,
--        (m.version IS NOT NULL) AS applied
-- FROM (VALUES ('20260315000000'), ('20260315000001'), ('20260315000002'),
--              ('20260315000003'), ('20260315000004'), ('20260315000005'),
--              ('20260315000006'), ('20260315000007'), ('20260315000008'),
--              ('20260315000009'), ('20260315000010'), ('20260315000011'),
--              ('20260315000012'), ('20260315000013'), ('20260315000014'),
--              ('20260331000000'), ('20260331000001'), ('20260908000000'),
--              ('20260909000000'), ('20260914000000'), ('20260925000000'),
--              ('20261006000000')) AS e(version)
-- LEFT JOIN supabase_migrations.schema_migrations m ON m.version = e.version
-- ORDER BY e.version;
-- And versions applied but NOT in the repository:
-- SELECT version FROM supabase_migrations.schema_migrations
-- WHERE version NOT IN ('20260315000000','20260315000001','20260315000002',
--   '20260315000003','20260315000004','20260315000005','20260315000006',
--   '20260315000007','20260315000008','20260315000009','20260315000010',
--   '20260315000011','20260315000012','20260315000013','20260315000014',
--   '20260331000000','20260331000001','20260908000000','20260909000000',
--   '20260914000000','20260925000000','20261006000000')
-- ORDER BY version;


-- =============================================================================
-- RESULT SHEET (fill in; do not mark SKIP / N/A as PASS)
-- =============================================================================
--   Migrations 1-21 ............ OK / FAIL (which file, error)
--   T1-T5 test data ............ OK / FAIL   (T5 PDF: yes / no)
--   S0 / S1 .................... OK / FAIL   (storage class: a / b / c / d / visible)
--   P1 PART A before ........... A4/A7 differ as expected: yes / no
--   P1 B1 before ............... FAIL B1a seen (expected): yes / no
--   Migration 22 ............... OK / FAIL
--   PART A after ............... A9 __  A10 __  A11 __  (all must be OK)
--   PART B ..................... B1 __ B2 __ B3 __ B4 __ B5 __
--   B6 ......................... PASS / N/A (FK cascade) / FAIL
--   Storage .................... PASS / NOT VERIFIED (a/b/c) / FAIL (d)
--   R0-R7 ...................... PASS / FAIL   (ban path: Dashboard / SQL)
--   SCHEMA INVENTORY diff ...... none / list differences + impact on this change
-- =============================================================================
