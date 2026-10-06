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

-- A9. has_role() owner and whether that owner bypasses RLS.
--     has_role() reads profiles and user_roles, whose own SELECT policies
--     call has_role(). That only terminates if the function owner is exempt
--     from RLS on both tables: either the role has BYPASSRLS / is superuser,
--     or it owns both tables (and A10 shows no FORCE ROW LEVEL SECURITY).
--     Expected verdict: 'OK: bypassrls' or 'OK: owns both tables'.
SELECT
  p.oid::regprocedure                         AS signature,
  pg_get_userbyid(p.proowner)                 AS function_owner,
  r.rolbypassrls                              AS owner_rolbypassrls,
  r.rolsuper                                  AS owner_rolsuper,
  pg_get_userbyid(prof.relowner)              AS profiles_owner,
  pg_get_userbyid(ur.relowner)                AS user_roles_owner,
  p.prosecdef                                 AS security_definer,
  p.proconfig                                 AS function_settings,
  CASE
    WHEN r.rolbypassrls OR r.rolsuper THEN 'OK: bypassrls'
    WHEN p.proowner = prof.relowner AND p.proowner = ur.relowner
      THEN 'OK: owns both tables'
    ELSE 'FAIL: owner is subject to RLS on profiles/user_roles'
  END                                         AS verdict
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
CROSS JOIN (SELECT relowner FROM pg_class WHERE oid = 'public.profiles'::regclass) prof
CROSS JOIN (SELECT relowner FROM pg_class WHERE oid = 'public.user_roles'::regclass) ur
WHERE n.nspname = 'public' AND p.proname = 'has_role';

-- A10. FORCE ROW LEVEL SECURITY must be OFF on profiles and user_roles
--      (FORCE would subject even the table owner to RLS -> has_role()
--      recursion). Read-only; raises if the expectation does not hold.
SELECT c.oid::regclass AS table_name, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
WHERE c.oid IN ('public.profiles'::regclass, 'public.user_roles'::regclass);

DO $$
DECLARE
  forced text;
BEGIN
  SELECT string_agg(c.oid::regclass::text, ', ')
    INTO forced
  FROM pg_class c
  WHERE c.oid IN ('public.profiles'::regclass, 'public.user_roles'::regclass)
    AND c.relforcerowsecurity;
  IF forced IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL A10: FORCE ROW LEVEL SECURITY is ON for: %', forced;
  END IF;
  RAISE NOTICE 'OK A10: relforcerowsecurity = false on profiles and user_roles';
END $$;

-- A11. has_role() signature: exactly one overload, taking ONLY the role
--      array — no user id parameter — so a caller can never ask about
--      another user; the subject is always auth.uid() inside the body.
SELECT p.oid::regprocedure AS signature,
       pg_get_function_identity_arguments(p.oid) AS identity_args,
       position('auth.uid()' IN p.prosrc) > 0 AS uses_auth_uid
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'has_role';

DO $$
DECLARE
  overloads int;
  bad_sig text;
BEGIN
  SELECT count(*) INTO overloads
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'has_role';
  IF overloads <> 1 THEN
    RAISE EXCEPTION 'FAIL A11: expected exactly 1 public.has_role overload, found %', overloads;
  END IF;

  SELECT p.oid::regprocedure::text INTO bad_sig
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'has_role'
    AND NOT (
      p.pronargs = 1
      AND p.proargtypes[0] = 'public.app_role[]'::regtype
      AND position('auth.uid()' IN p.prosrc) > 0
    );
  IF bad_sig IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL A11: unexpected has_role signature/body: %', bad_sig;
  END IF;
  RAISE NOTICE 'OK A11: has_role(app_role[]) only; subject is auth.uid()';
END $$;

-- =============================================================================
-- PART B — behavioral tests (local / branch / staging ONLY — never prod)
--
-- Every block:
--   * runs inside BEGIN ... ROLLBACK — nothing is ever committed;
--   * impersonates with transaction-local settings only:
--       set_config(..., true)  for request.jwt.claims / request.jwt.claim.sub
--                              and the expected test uid (ljf.test_uid)
--       SET LOCAL ROLE authenticated | anon
--       SET LOCAL ROLE NONE    to return to the session user mid-transaction
--     (no plain SET / SET ROLE / set_config(..., false) anywhere);
--   * fails loudly (RAISE EXCEPTION) when a required test user or test row is
--     missing — an empty table is never read as "access denied";
--   * asserts auth.uid() = the expected UUID right after impersonating,
--     before any access assertion.
--
-- Preconditions on the staging / branch DB (RAISE EXCEPTION otherwise):
--   * >= 1 ACTIVE editor   (user_roles.role = 'editor', profile active, not deleted)
--   * >= 1 ACTIVE admin
--   * >= 1 row in public.contacts (protected table: SELECT needs has_role)
--
-- Run each block as a whole (from its BEGIN to its ROLLBACK). If a block
-- stops on an error, issue ROLLBACK before running anything else.
-- =============================================================================

-- B1. A signed-in (active editor) user cannot rewrite their own
--     status / deleted_at / role, nor insert profiles.
BEGIN;
DO $$
DECLARE
  target uuid;
BEGIN
  SELECT r.user_id INTO target
  FROM public.user_roles r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'editor' AND p.status = 'active' AND p.deleted_at IS NULL
  ORDER BY r.user_id
  LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION B1: no active editor exists — create one on staging first';
  END IF;
  PERFORM set_config('ljf.test_uid', target::text, true);
  PERFORM set_config('request.jwt.claim.sub', target::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target::text, 'role', 'authenticated')::text,
    true
  );
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B1: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  -- Positive control: the impersonation is effective (editor rights).
  IF NOT public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B1: active editor should have has_role(editor) = true';
  END IF;

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

  -- user_roles writes need has_role(admin) (RLS): an editor's UPDATE of
  -- their own row must match 0 rows (or be refused outright if the table
  -- privilege itself is absent — also a pass).
  BEGIN
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = auth.uid();
    IF FOUND THEN
      RAISE EXCEPTION 'FAIL B1c: editor changed own role';
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  IF public.has_role(ARRAY['admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B1c: editor became admin';
  END IF;
  RAISE NOTICE 'OK B1c: editor cannot change own role';
END $$;
ROLLBACK;

-- B2. Same editor: ACTIVE sees protected rows (positive), SUSPENDED sees none
--     (negative) — tables and storage — with the very same JWT identity.
BEGIN;
DO $$
DECLARE
  target uuid;
  n bigint;
BEGIN
  SELECT r.user_id INTO target
  FROM public.user_roles r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'editor' AND p.status = 'active' AND p.deleted_at IS NULL
  ORDER BY r.user_id
  LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION B2: no active editor exists — create one on staging first';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n = 0 THEN
    RAISE EXCEPTION 'PRECONDITION B2: public.contacts is empty — insert a test contact on staging first';
  END IF;
  PERFORM set_config('ljf.test_uid', target::text, true);
  PERFORM set_config('ljf.contacts_total', n::text, true);
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'attachments';
  PERFORM set_config('ljf.attachments_total', n::text, true);
  PERFORM set_config('request.jwt.claim.sub', target::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target::text, 'role', 'authenticated')::text,
    true
  );
END $$;

-- B2 positive: active editor
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B2+: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF NOT public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B2+: active editor has_role(editor) = false';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL B2+: active editor sees 0 contacts (expected >= 1)';
  END IF;
  RAISE NOTICE 'OK B2+: active editor has_role(editor) and sees % contacts', n;

  IF current_setting('ljf.attachments_total')::bigint > 0 THEN
    SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'attachments';
    IF n < 1 THEN
      RAISE EXCEPTION 'FAIL B2+: active editor sees 0 attachments objects';
    END IF;
    RAISE NOTICE 'OK B2+: active editor sees % attachments objects', n;
  ELSE
    RAISE NOTICE 'SKIP B2 storage: attachments bucket is empty (storage not asserted)';
  END IF;
END $$;

-- suspend the same user (as the session user, inside this txn only)
SET LOCAL ROLE NONE;
DO $$
BEGIN
  UPDATE public.profiles SET status = 'suspended'
  WHERE id = current_setting('ljf.test_uid')::uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL B2: could not suspend the test user (row not found)';
  END IF;
END $$;

-- B2 negative: suspended editor, same JWT
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B2-: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B2-: suspended editor still has_role(editor)';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL B2-: suspended editor sees % contacts (expected 0)', n;
  END IF;
  RAISE NOTICE 'OK B2-: suspended editor has_role(editor) = false and sees 0 contacts';

  IF current_setting('ljf.attachments_total')::bigint > 0 THEN
    SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'attachments';
    IF n <> 0 THEN
      RAISE EXCEPTION 'FAIL B2-: suspended editor sees % attachments objects', n;
    END IF;
    RAISE NOTICE 'OK B2-: suspended editor sees 0 attachments objects';
  END IF;
END $$;
ROLLBACK;

-- B3. Same as B2 for a soft-deleted editor (deleted_at set, status unchanged).
BEGIN;
DO $$
DECLARE
  target uuid;
  n bigint;
BEGIN
  SELECT r.user_id INTO target
  FROM public.user_roles r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'editor' AND p.status = 'active' AND p.deleted_at IS NULL
  ORDER BY r.user_id
  LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION B3: no active editor exists — create one on staging first';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n = 0 THEN
    RAISE EXCEPTION 'PRECONDITION B3: public.contacts is empty — insert a test contact on staging first';
  END IF;
  PERFORM set_config('ljf.test_uid', target::text, true);
  PERFORM set_config('request.jwt.claim.sub', target::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target::text, 'role', 'authenticated')::text,
    true
  );
END $$;

-- B3 positive: active editor
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B3+: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF NOT public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B3+: active editor has_role(editor) = false';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL B3+: active editor sees 0 contacts (expected >= 1)';
  END IF;
  RAISE NOTICE 'OK B3+: active editor has_role(editor) and sees % contacts', n;
END $$;

-- soft-delete the same user (session user, this txn only)
SET LOCAL ROLE NONE;
DO $$
BEGIN
  UPDATE public.profiles SET deleted_at = now()
  WHERE id = current_setting('ljf.test_uid')::uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL B3: could not soft-delete the test user (row not found)';
  END IF;
END $$;

-- B3 negative: deleted editor, same JWT
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B3-: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF public.has_role(ARRAY['editor']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B3-: deleted editor still has_role(editor)';
  END IF;
  SELECT count(*) INTO n FROM public.contacts;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL B3-: deleted editor sees % contacts (expected 0)', n;
  END IF;
  RAISE NOTICE 'OK B3-: deleted editor has_role(editor) = false and sees 0 contacts';
END $$;
ROLLBACK;

-- B4. Regression: an ACTIVE admin keeps access, can read own profile and
--     user_roles, but (like everyone) cannot UPDATE profiles directly.
BEGIN;
DO $$
DECLARE
  target uuid;
BEGIN
  SELECT r.user_id INTO target
  FROM public.user_roles r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL
  ORDER BY r.user_id
  LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION B4: no active admin exists';
  END IF;
  PERFORM set_config('ljf.test_uid', target::text, true);
  PERFORM set_config('request.jwt.claim.sub', target::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target::text, 'role', 'authenticated')::text,
    true
  );
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  expected uuid := current_setting('ljf.test_uid')::uuid;
  n bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL B4: auth.uid() = %, expected %', auth.uid(), expected;
  END IF;
  IF NOT public.has_role(ARRAY['admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B4: active admin lost has_role(admin)';
  END IF;
  PERFORM 1 FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL B4: active admin cannot read own profile';
  END IF;
  SELECT count(*) INTO n FROM public.user_roles;
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL B4: active admin sees 0 user_roles rows';
  END IF;
  BEGIN
    UPDATE public.profiles SET display_name = display_name WHERE id = auth.uid();
    RAISE EXCEPTION 'FAIL B4: admin could UPDATE profiles directly (should go via API)';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RAISE NOTICE 'OK B4: active admin keeps access; direct profiles UPDATE denied';
END $$;
ROLLBACK;

-- B5. Anonymous visitors: no identity, public content unaffected.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE
  n bigint;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL B5: anon has auth.uid() = % (claims leaked from an earlier block?)',
      auth.uid();
  END IF;
  IF public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]) THEN
    RAISE EXCEPTION 'FAIL B5: anon has_role() = true';
  END IF;
  SELECT count(*) INTO n FROM public.settings;
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL B5: anon cannot read settings (expected >= 1 public row)';
  END IF;
  -- 0 rows via RLS, or no table privilege at all: both mean "denied".
  BEGIN
    SELECT count(*) INTO n FROM public.contacts;
    IF n <> 0 THEN
      RAISE EXCEPTION 'FAIL B5: anon sees % contacts', n;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RAISE NOTICE 'OK B5: anon has no identity, reads public settings, sees 0 contacts';
END $$;
ROLLBACK;
