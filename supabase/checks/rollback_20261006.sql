-- =============================================================================
-- ROLLBACK for migration 22
--   supabase/migrations/20261006000000_harden_profiles_and_role_checks.sql
--
-- Restores the database to its state immediately before migration 22:
--   1. public.has_role() -> the definition from 20260315000000_init.sql:119-135
--      (the ONLY definition between init and migration 22 — no migration in
--      between redefines it). Same LANGUAGE sql, STABLE, SECURITY DEFINER,
--      SET search_path = public. CREATE OR REPLACE keeps the existing owner
--      and the existing EXECUTE privileges, so the owner is unchanged.
--   2. Re-grants exactly what migration 22 revoked:
--        INSERT, UPDATE ON TABLE public.profiles  TO authenticated
--        INSERT, UPDATE ON TABLE public.profiles  TO anon
--      (table level, no WITH GRANT OPTION — the Supabase default form).
--   3. Migration 22 created no new objects (it only replaced has_role,
--      restated its EXECUTE grants, and revoked two privileges), so there is
--      nothing to drop. Its EXECUTE grants on has_role already existed since
--      init.sql:134-135 and are therefore kept.
--
-- BEFORE relying on this file, compare with what prod_readonly_checks.sql
-- recorded BEFORE migration 22 was applied:
--   * A12: the saved has_role definition must equal section 1 below. If it
--     differs (production drift), paste the saved definition into section 1.
--   * A7 : both authenticated and anon must have had 'a' and 'w', without
--     '*'. If a role lacked one of them, remove that privilege below. If a
--     '*' was present, add WITH GRANT OPTION to that line.
--   * A7-col: must have been 0 rows. Column-level privileges on profiles are
--     removed by migration 22's table-level revoke and are NOT restored here;
--     if A7-col had rows, add matching column-level grants below first.
--   * Grantor: the re-granted privileges are recorded with the executing
--     role as grantor (A7 "given_by"). If the original grantor differed
--     (e.g. supabase_admin), the effective privileges are identical but the
--     ACL text differs in the grantor part only.
--
-- Run as the role that owns has_role (normally postgres — the same role that
-- applied the migrations). Execute the whole file at once; it is a single
-- transaction. If the in-transaction check raises, run ROLLBACK; and
-- investigate — nothing is changed in that case.
--
-- After this, the application keeps working as is: the backend uses the
-- service role (unaffected by these grants and by has_role), and the new
-- frontend never writes profiles or calls has_role. Security returns to the
-- pre-migration-22 level at the DB layer only (suspended users regain
-- role-based direct DB access; the backend still denies them).
-- If migration 22 was applied with the Supabase CLI, schema_migrations still
-- lists 20261006000000 — see docs/deploy-rbac-hardening.md (rollback section).
-- =============================================================================

BEGIN;

-- 0. Preconditions
DO $$
DECLARE
  fn regprocedure := to_regprocedure('public.has_role(public.app_role[])');
  owner_oid oid;
BEGIN
  IF fn IS NULL THEN
    RAISE EXCEPTION 'ROLLBACK-0: public.has_role(public.app_role[]) not found';
  END IF;
  SELECT proowner INTO owner_oid FROM pg_proc WHERE oid = fn;
  IF NOT pg_has_role(current_user, owner_oid, 'MEMBER') THEN
    RAISE EXCEPTION 'ROLLBACK-0: current_user % cannot replace has_role (owner is %)',
      current_user, pg_get_userbyid(owner_oid);
  END IF;
  RAISE NOTICE 'ROLLBACK-0 OK: has_role owner = %, running as %',
    pg_get_userbyid(owner_oid), current_user;
END $$;

-- 1. has_role(): definition immediately before migration 22
--    (verbatim from 20260315000000_init.sql:119-135)
CREATE OR REPLACE FUNCTION public.has_role(required_roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (required_roles)
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO anon;

-- 2. profiles: re-grant exactly what migration 22 revoked
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO anon;

-- 3. Nothing to drop (migration 22 created no objects).

-- 4. In-transaction verification: abort (and change nothing) unless restored
DO $$
DECLARE
  fn regprocedure := to_regprocedure('public.has_role(public.app_role[])');
  src text;
  definer boolean;
  cfg text[];
BEGIN
  SELECT prosrc, prosecdef, proconfig INTO src, definer, cfg FROM pg_proc WHERE oid = fn;
  IF position('p.status' IN src) > 0 OR position('public.profiles' IN src) > 0 THEN
    RAISE EXCEPTION 'ROLLBACK-4: has_role still references profiles';
  END IF;
  IF NOT definer THEN
    RAISE EXCEPTION 'ROLLBACK-4: has_role is not SECURITY DEFINER';
  END IF;
  IF cfg IS NULL OR NOT ('search_path=public' = ANY (cfg)) THEN
    RAISE EXCEPTION 'ROLLBACK-4: has_role search_path is %, expected search_path=public', cfg;
  END IF;
  IF NOT (has_table_privilege('authenticated', 'public.profiles', 'INSERT')
      AND has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
      AND has_table_privilege('anon',          'public.profiles', 'INSERT')
      AND has_table_privilege('anon',          'public.profiles', 'UPDATE')) THEN
    RAISE EXCEPTION 'ROLLBACK-4: profiles privileges not restored';
  END IF;
  RAISE NOTICE 'ROLLBACK-4 OK: has_role and profiles privileges restored';
END $$;

COMMIT;

-- 5. Post-rollback confirmation (read-only)
SELECT pg_get_functiondef('public.has_role(public.app_role[])'::regprocedure) AS has_role_definition;

SELECT p.oid::regprocedure        AS signature,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef                 AS security_definer,
       p.proconfig                 AS function_settings,
       position('p.status = ''active''' IN p.prosrc) > 0 AS checks_status_expected_false
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'has_role';

SELECT split_part(acl::text, '=', 1)                     AS role,
       split_part(split_part(acl::text, '=', 2), '/', 1) AS privilege_letters_expect_a_and_w,
       split_part(acl::text, '/', 2)                     AS given_by
FROM pg_class c
CROSS JOIN LATERAL unnest(c.relacl) AS acl
WHERE c.oid = 'public.profiles'::regclass
  AND split_part(acl::text, '=', 1) IN ('authenticated', 'anon')
ORDER BY split_part(acl::text, '=', 1) COLLATE "C";
