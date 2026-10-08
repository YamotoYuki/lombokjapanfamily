-- Restrict reads of the private `sponsor-files` bucket (sponsor deal
-- attachments) to admin / editor.
--
-- Until now ljf_sponsor_files_select (20260315000005_sponsors_cms.sql)
-- also let viewers SELECT these objects, i.e. list and download them
-- straight from Supabase Storage with the public anon key and their own
-- session. The sponsor APIs and screens are admin / editor only, so this
-- aligns Storage with them (same change as 20261008000000 for
-- `attachments`).
--
-- Only the SELECT policy changes. INSERT / UPDATE (admin, editor) and
-- DELETE (admin) are untouched. has_role() keeps its status / deleted_at
-- checks from 20261006000000_harden_profiles_and_role_checks.sql.
-- The backend uses the service role and is unaffected.
--
-- Idempotent. Rollback: docs/deploy-attachments-read-restriction.md.

DROP POLICY IF EXISTS ljf_sponsor_files_select ON storage.objects;
CREATE POLICY ljf_sponsor_files_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );
