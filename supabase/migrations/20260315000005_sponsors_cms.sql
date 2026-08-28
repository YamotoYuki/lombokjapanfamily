-- STEP9: Sponsor / corporate deal management

-- Expand sponsor_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sponsor_status' AND e.enumlabel = 'negotiating'
  ) THEN
    ALTER TYPE public.sponsor_status ADD VALUE 'negotiating';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sponsor_status' AND e.enumlabel = 'review'
  ) THEN
    ALTER TYPE public.sponsor_status ADD VALUE 'review';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sponsor_status' AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE public.sponsor_status ADD VALUE 'cancelled';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sponsor_project_type AS ENUM (
    'sponsor',
    'collaboration',
    'advertisement',
    'media',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS project_type public.sponsor_project_type NOT NULL DEFAULT 'sponsor',
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS publish_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Ensure required fields
UPDATE public.sponsors
SET project_name = coalesce(nullif(project_name, ''), '（案件名未設定）')
WHERE project_name IS NULL OR project_name = '';

ALTER TABLE public.sponsors ALTER COLUMN project_name SET NOT NULL;

UPDATE public.sponsors SET amount = 0 WHERE amount IS NULL;
ALTER TABLE public.sponsors ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE public.sponsors ALTER COLUMN amount SET NOT NULL;

ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_status_check;
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_status_check
  CHECK (
    status::text IN (
      'proposal',
      'negotiating',
      'contracted',
      'production',
      'review',
      'published',
      'completed',
      'cancelled'
    )
  );

ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_amount_check;
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_amount_check
  CHECK (amount >= 0);

CREATE INDEX IF NOT EXISTS idx_sponsors_project_type ON public.sponsors (project_type);
CREATE INDEX IF NOT EXISTS idx_sponsors_is_visible ON public.sponsors (is_visible);
CREATE INDEX IF NOT EXISTS idx_sponsors_due_date ON public.sponsors (due_date);
CREATE INDEX IF NOT EXISTS idx_sponsors_created_at ON public.sponsors (created_at DESC);

DROP TRIGGER IF EXISTS trg_sponsors_updated_at ON public.sponsors;
CREATE TRIGGER trg_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for sponsor files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sponsor-files',
  'sponsor-files',
  FALSE,
  20971520,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS ljf_sponsor_files_select ON storage.objects;
CREATE POLICY ljf_sponsor_files_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

DROP POLICY IF EXISTS ljf_sponsor_files_insert ON storage.objects;
CREATE POLICY ljf_sponsor_files_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

DROP POLICY IF EXISTS ljf_sponsor_files_update ON storage.objects;
CREATE POLICY ljf_sponsor_files_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

DROP POLICY IF EXISTS ljf_sponsor_files_delete ON storage.objects;
CREATE POLICY ljf_sponsor_files_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

-- Future extensions
-- TODO: 請求書管理
-- TODO: 契約書管理
-- TODO: Stripe決済管理
-- TODO: 売上レポートPDF
-- TODO: 税務管理
-- TODO: 案件自動リマインド通知
-- TODO: Google Calendar連携
