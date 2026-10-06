-- Verification SQL for 20261006000000_harden_profiles_and_role_checks.sql
-- (and the matching backend/frontend release on branch
-- security/harden-admin-rbac).
--
-- NOT a migration: the Supabase CLI does not run files in supabase/checks/.
-- Run sections by hand in the SQL editor / psql.
--
--   PART A  read-only. Safe on production. Run BEFORE and AFTER applying.
--   PART B  behavioral tests. Every block runs in a transaction that ends in
--           ROLLBACK, but it temporarily changes rows inside that
--           transaction — run on a local DB / Supabase branch / staging
--           ONLY, never on production.

-- =============================================================================
-- PART A — read-only checks (production-safe)
-- =============================================================================

-- A1. Role-less profiles. After the release these accounts are denied by the
--     API and the admin UI (they used to be treated as "viewer"). Give real
--     staff a role BEFORE releasing.
SELECT p.id, p.email, p.status, p.deleted_at, p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles r ON r.user_id = p.id
WHERE r.user_id IS NULL
ORDER BY p.created_at;

-- A2. Already suspended / inactive / deleted profiles and their Supabase Auth
--     ban state. Accounts deactivated before this release are NOT banned in
--     Auth (banned_until IS NULL) — re-apply via the CMS (reactivate, then
--     suspend/delete again) so the Auth ban is set.
SELECT p.id, p.email, p.status, p.deleted_at, u.banned_until
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.status <> 'active' OR p.deleted_at IS NOT NULL
ORDER BY p.email;

-- A3. Usable admins. Must be >= 1 (A-4 keeps it that way from now on).
SELECT count(*) AS active_admins
FROM public.user_roles r
JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL;

-- A4. Every function that reads user_roles. Expected after the migration:
--     only has_role, and its body must contain "p.status = 'active'".
SELECT n.nspname AS schema, p.proname, p.prosecdef AS security_definer,
       position('p.status = ''active''' IN p.prosrc) > 0 AS checks_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc ILIKE '%user_roles%'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');

-- A5. Policies (any schema, incl. storage) that reference user_roles directly
--     instead of going through has_role(). Expected: only the user_roles
--     table's own policies, which use auth.uid() = user_id / has_role().
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE coalesce(qual, '') ILIKE '%user_roles%'
   OR coalesce(with_check, '') ILIKE '%user_roles%';

-- A6. Storage policies that grant to authenticated WITHOUT has_role() or an
--     owner-folder check. Expected: none (public-read buckets are TO public
--     SELECT only).
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND NOT (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%has_role%'
  AND cmd <> 'SELECT';

-- A7. profiles privileges for browser roles. After the migration: no INSERT
--     and no UPDATE rows here (table- or column-level).
SELECT 'table' AS level, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE')
UNION ALL
SELECT 'column', grantee, privilege_type || ' (' || column_name || ')'
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE');

-- A8. Profile creation still works: the signup trigger must exist and be
--     SECURITY DEFINER (so the REVOKE above does not affect it).
SELECT t.tgname, p.proname, p.prosecdef AS security_definer
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal;

-- =============================================================================
-- PART B — behavioral tests (local / branch / staging ONLY — never prod)
-- Each block: BEGIN ... ROLLBACK. Needs at least one profile with a role.
-- A block that prints NOTICE 'OK ...' passed; 'FAIL ...' raises an error.
-- =============================================================================

-- B1. A signed-in user cannot rewrite their own status / deleted_at / role.
BEGIN;
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', r.user_id::text, 'role', 'authenticated')::text,
  true
)
FROM public.user_roles r LIMIT 1;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET status = 'active', deleted_at = NULL WHERE id = auth.uid();
    RAISE EXCEPTION 'FAIL B1a: authenticated could UPDATE profiles';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'OK B1a: UPDATE profiles denied';
  END;
  BEGIN
    INSERT INTO public.profiles (id, email) VALUES (gen_random_uuid(), 'x@example.com');
    RAISE EXCEPTION 'FAIL B1b: authenticated could INSERT profiles';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'OK B1b: INSERT profiles denied';
  END;
  -- user_roles: RLS lets only (active) admins write; a non-admin's UPDATE
  -- matches 0 rows instead of raising.
  IF NOT public.has_role(ARRAY['admin']::public.app_role[]) THEN
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = auth.uid();
    IF FOUND THEN
      RAISE EXCEPTION 'FAIL B1c: non-admin changed own role';
    END IF;
    RAISE NOTICE 'OK B1c: non-admin cannot change own role';
  ELSE
    RAISE NOTICE 'SKIP B1c: picked user is an admin';
  END IF;
END $$;
ROLLBACK;

-- B2. Suspending a staff member removes all role-based DB access (tables
--     and storage), even with a still-valid JWT.
BEGIN;
-- (as the migration owner) suspend some staff member inside this txn only
CREATE TEMP TABLE _b2 ON COMMIT DROP AS
  SELECT r.user_id FROM public.user_roles r LIMIT 1;
UPDATE public.profiles SET status = 'suspended' WHERE id = (SELECT user_id FROM _b2);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', (SELECT user_id FROM _b2)::text, 'role', 'authenticated')::text,
  true
);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  n bigint;
BEGIN
  IF public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B2a: suspended user still has_role()';
  END IF;
  RAISE NOTICE 'OK B2a: has_role() false for suspended user';

  -- Vacuous if the contacts table is empty; B2a is the real assertion.
  SELECT count(*) INTO n FROM public.contacts;
  IF n > 0 THEN RAISE EXCEPTION 'FAIL B2b: suspended user can read contacts'; END IF;
  RAISE NOTICE 'OK B2b: contacts hidden from suspended user';

  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'attachments';
  IF n > 0 THEN RAISE EXCEPTION 'FAIL B2c: suspended user can list attachments'; END IF;
  RAISE NOTICE 'OK B2c: attachments bucket hidden from suspended user';
END $$;
ROLLBACK;

-- B3. Same check for a soft-deleted staff member.
BEGIN;
CREATE TEMP TABLE _b3 ON COMMIT DROP AS
  SELECT r.user_id FROM public.user_roles r LIMIT 1;
UPDATE public.profiles SET deleted_at = now() WHERE id = (SELECT user_id FROM _b3);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', (SELECT user_id FROM _b3)::text, 'role', 'authenticated')::text,
  true
);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B3: deleted user still has_role()';
  END IF;
  RAISE NOTICE 'OK B3: has_role() false for deleted user';
END $$;
ROLLBACK;

-- B4. Regression: an ACTIVE staff member keeps access.
BEGIN;
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', r.user_id::text, 'role', 'authenticated')::text,
  true
)
FROM public.user_roles r
JOIN public.profiles p ON p.id = r.user_id
WHERE p.status = 'active' AND p.deleted_at IS NULL
LIMIT 1;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B4: active staff lost has_role()';
  END IF;
  -- Own profile is still readable (the admin UI no longer needs this, but
  -- profiles_select is unchanged).
  PERFORM 1 FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL B4: cannot read own profile'; END IF;
  RAISE NOTICE 'OK B4: active staff keeps access and can read own profile';
END $$;
ROLLBACK;

-- B5. Anonymous visitors: public content unaffected.
BEGIN;
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM 1 FROM public.settings LIMIT 1;
  PERFORM count(*) FROM public.family_profiles;  -- visible rows only (RLS)
  PERFORM count(*) FROM public.gallery;
  RAISE NOTICE 'OK B5: anon public reads still work';
END $$;
ROLLBACK;
