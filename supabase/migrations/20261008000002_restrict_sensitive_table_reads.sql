-- Close direct (PostgREST) reads of sensitive tables by viewers.
--
-- Until now the generic "content table" loops (20260315000000_init.sql,
-- 20260315000007_rbac_users_audit.sql) gave every CMS role, viewer
-- included, SELECT on contacts and sponsors; profiles_select and
-- user_roles_select (20260315000007) let every CMS role read every row.
-- A viewer could therefore read all inquiries (names, emails, phones,
-- messages, internal notes), all sponsor deals (amounts, contacts,
-- attachment URLs), every user's email / status and every user's role
-- straight from Supabase with the public anon key and their own session,
-- although the Flask API and the admin UI deny them.
--
-- After this migration:
--   contacts, sponsors     SELECT: admin, editor
--   profiles, user_roles   SELECT: own row (any signed-in user) or admin
--
-- Nothing else changes: INSERT / UPDATE / DELETE policies are untouched
-- (and authenticated / anon have no INSERT / UPDATE on profiles since
-- 20261006000000). has_role() is SECURITY DEFINER, so it still reads
-- user_roles / profiles regardless of these policies. The backend uses
-- the service role (bypasses RLS) and the frontend does not read these
-- tables directly (only /api/* and supabase.auth.*).
--
-- Policies dropped and recreated (same names):
--   public.contacts    contacts_select
--   public.sponsors    sponsors_select
--   public.profiles    profiles_select
--   public.user_roles  user_roles_select
--
-- Idempotent. Rollback: docs/deploy-sensitive-table-reads.md.

DROP POLICY IF EXISTS contacts_select ON public.contacts;
CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

DROP POLICY IF EXISTS sponsors_select ON public.sponsors;
CREATE POLICY sponsors_select ON public.sponsors
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin']::public.app_role[])
  );

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(ARRAY['admin']::public.app_role[])
  );
