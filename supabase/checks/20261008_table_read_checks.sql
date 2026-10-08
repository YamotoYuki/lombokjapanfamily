-- Behavioral checks for 20261008000002_restrict_sensitive_table_reads.sql.
--
-- Run in the Supabase SQL Editor AFTER applying the migration (the
-- "before" run is expected to FAIL on the viewer / editor rows — that is
-- the hole the migration closes). Read-only: the whole script runs inside
-- BEGIN ... ROLLBACK; role switching and JWT claims are transaction-local.
--
-- Replace the three UUIDs with ACTIVE users (status = 'active',
-- deleted_at IS NULL) that hold exactly that role. Leave a placeholder
-- as is to skip that role (reported as SKIP, never as OK).
--
-- Expected (after the migration):
--   contacts / sponsors    admin = all rows, editor = all rows, viewer = 0
--   profiles / user_roles  admin = all rows, editor = 1 (own), viewer = 1 (own)

BEGIN;

DO $$
DECLARE
  ids CONSTANT jsonb := jsonb_build_object(
    'admin',  '<admin-uuid>',
    'editor', '<editor-uuid>',
    'viewer', '<viewer-uuid>'
  );
  r text;
  uid uuid;
  ok boolean;
  tot_contacts bigint;
  tot_sponsors bigint;
  tot_profiles bigint;
  tot_roles bigint;
  n_contacts bigint;
  n_sponsors bigint;
  n_profiles bigint;
  n_roles bigint;
BEGIN
  -- Totals as the SQL Editor's session user (table owner, RLS not applied).
  SELECT count(*) INTO tot_contacts FROM public.contacts;
  SELECT count(*) INTO tot_sponsors FROM public.sponsors;
  SELECT count(*) INTO tot_profiles FROM public.profiles;
  SELECT count(*) INTO tot_roles    FROM public.user_roles;
  RAISE NOTICE 'totals: contacts=% sponsors=% profiles=% user_roles=%',
    tot_contacts, tot_sponsors, tot_profiles, tot_roles;

  FOREACH r IN ARRAY ARRAY['admin', 'editor', 'viewer'] LOOP
    IF (ids ->> r) LIKE '<%' THEN
      RAISE NOTICE 'SKIP %: no user given', r;
      CONTINUE;
    END IF;
    uid := (ids ->> r)::uuid;

    -- Precondition: the given user really is an active <r>.
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.user_id = uid AND ur.role::text = r
        AND p.status = 'active' AND p.deleted_at IS NULL
    ) INTO ok;
    IF NOT ok THEN
      RAISE EXCEPTION 'PRECONDITION %: % is not an active % user', r, uid, r;
    END IF;

    -- Both forms, like 20261006_rbac_hardening_checks.sql (older auth.uid()
    -- reads request.jwt.claim.sub).
    PERFORM set_config('request.jwt.claim.sub', uid::text, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', uid, 'role', 'authenticated')::text,
      true
    );
    SET LOCAL ROLE authenticated;
    IF auth.uid() IS DISTINCT FROM uid THEN
      RAISE EXCEPTION 'SETUP %: auth.uid() = %, expected %', r, auth.uid(), uid;
    END IF;
    SELECT count(*) INTO n_contacts FROM public.contacts;
    SELECT count(*) INTO n_sponsors FROM public.sponsors;
    SELECT count(*) INTO n_profiles FROM public.profiles;
    SELECT count(*) INTO n_roles    FROM public.user_roles;
    RESET ROLE;

    IF r IN ('admin', 'editor') THEN
      IF n_contacts <> tot_contacts OR n_sponsors <> tot_sponsors THEN
        RAISE EXCEPTION 'FAIL %: contacts %/% sponsors %/% (expected all)',
          r, n_contacts, tot_contacts, n_sponsors, tot_sponsors;
      END IF;
    ELSE
      IF n_contacts <> 0 OR n_sponsors <> 0 THEN
        RAISE EXCEPTION 'FAIL %: contacts=% sponsors=% (expected 0)',
          r, n_contacts, n_sponsors;
      END IF;
    END IF;

    IF r = 'admin' THEN
      IF n_profiles <> tot_profiles OR n_roles <> tot_roles THEN
        RAISE EXCEPTION 'FAIL admin: profiles %/% user_roles %/% (expected all)',
          n_profiles, tot_profiles, n_roles, tot_roles;
      END IF;
    ELSE
      IF n_profiles <> 1 OR n_roles <> 1 THEN
        RAISE EXCEPTION 'FAIL %: profiles=% user_roles=% (expected 1 = own row)',
          r, n_profiles, n_roles;
      END IF;
    END IF;

    RAISE NOTICE 'OK %: contacts=% sponsors=% profiles=% user_roles=%',
      r, n_contacts, n_sponsors, n_profiles, n_roles;
  END LOOP;

  IF tot_contacts = 0 OR tot_sponsors = 0 THEN
    RAISE NOTICE 'NOTE: contacts or sponsors is empty; the all-rows check on that table proves nothing (record it as NOT VERIFIED)';
  END IF;
END $$;

ROLLBACK;
