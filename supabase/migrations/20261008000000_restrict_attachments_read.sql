-- Restrict reads of the private `attachments` bucket (contact-form
-- attachments) to admin / editor.
--
-- Until now ljf_attachments_auth_read (20260315000000_init.sql) also let
-- viewers SELECT these objects. Viewers cannot open contacts in the API
-- (require_editor) or the admin UI (RequireEditor), but could still list
-- and download the attachments straight from Supabase Storage with the
-- public anon key and their own session. This aligns Storage with the API.
--
-- Only the SELECT policy changes. INSERT / UPDATE (admin, editor) and
-- DELETE (admin) are untouched. has_role() keeps its status / deleted_at
-- checks from 20261006000000_harden_profiles_and_role_checks.sql.
-- The backend uses the service role and is unaffected.
--
-- The `sponsor-files` bucket is deliberately NOT changed here
-- (ljf_sponsor_files_select still includes viewer).
--
-- Idempotent. Rollback: docs/deploy-attachments-read-restriction.md.

DROP POLICY IF EXISTS ljf_attachments_auth_read ON storage.objects;
CREATE POLICY ljf_attachments_auth_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );
