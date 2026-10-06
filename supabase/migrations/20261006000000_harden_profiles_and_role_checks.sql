-- Harden RBAC against suspended / deleted accounts and self-service edits.
--
-- 1. has_role() now also requires the caller's profile to be usable
--    (status = 'active' AND deleted_at IS NULL). Every RLS policy on the
--    public tables and every storage.objects policy authorizes through
--    has_role(), so a suspended or deleted user loses all role-based DB
--    access at once — including direct PostgREST / Storage calls with the
--    public anon key, which bypass the Flask API entirely.
--    has_role() is the ONLY function / policy that reads user_roles
--    (checked across all migrations); the user_roles policies themselves
--    use auth.uid() = user_id (self read) or has_role().
--
-- 2. authenticated / anon lose INSERT and UPDATE on public.profiles. The
--    old profiles_update policy let any user rewrite their own row,
--    including status and deleted_at — i.e. undo their own suspension.
--    No column-level grant is added: the browser no longer writes profiles
--    at all (last_login_at is recorded by the backend login with the
--    service role). Profile rows are still created by the existing
--    SECURITY DEFINER trigger public.handle_new_user() (runs as its owner,
--    unaffected by these grants), and all CMS profile edits go through the
--    Flask API (service role, which keeps its own grants).
--
-- Safe to apply before or after the matching application release: the
-- backend never relied on these grants (service role), and the frontend
-- stopped writing profiles in the same change set.
--
-- Does NOT rewrite earlier migrations. Idempotent.

-- ---------------------------------------------------------------------------
-- 1. has_role(): only active, non-deleted accounts hold their role
-- ---------------------------------------------------------------------------
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
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (required_roles)
      AND p.status = 'active'
      AND p.deleted_at IS NULL
  );
$$;

-- CREATE OR REPLACE keeps existing EXECUTE grants; restated for clarity.
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO anon;

-- ---------------------------------------------------------------------------
-- 2. profiles: no direct INSERT / UPDATE from the browser roles
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE INSERT, UPDATE ON TABLE public.profiles FROM anon;

-- The row-level policies below are now unreachable for these roles (no
-- table privilege), but are left in place untouched so this migration only
-- removes capability and never widens it.
--   profiles_insert, profiles_update  (20260315000007_rbac_users_audit.sql)
