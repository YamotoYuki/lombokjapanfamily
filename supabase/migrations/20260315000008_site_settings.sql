-- STEP12: Site settings system (columns, storage, RLS)

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_address TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS x_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS ga4_measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Ensure a single settings row exists
INSERT INTO public.settings (
  site_name,
  site_description,
  contact_email,
  youtube_channel_url,
  seo_title,
  seo_description,
  maintenance_mode
)
SELECT
  'Lombok-Japan Family',
  '日本とインドネシアを繋ぐファミリーチャンネル。旅・食・日常・文化交流を家族の視点で発信しています。',
  NULL,
  'https://www.youtube.com/@LombokJapanFamily',
  'Lombok-Japan Family | Official Website',
  '日本とインドネシアを繋ぐファミリーチャンネル公式サイト',
  FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);

-- ---------------------------------------------------------------------------
-- RLS: public read, editor select, admin full
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS settings_select ON public.settings;
DROP POLICY IF EXISTS settings_insert ON public.settings;
DROP POLICY IF EXISTS settings_update ON public.settings;
DROP POLICY IF EXISTS settings_delete ON public.settings;

CREATE POLICY settings_select ON public.settings
  FOR SELECT
  USING (
    TRUE
  );

CREATE POLICY settings_insert ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY settings_update ON public.settings
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY settings_delete ON public.settings
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

-- ---------------------------------------------------------------------------
-- Storage: settings-assets (logo / favicon / og)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'settings-assets',
  'settings-assets',
  TRUE,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS ljf_settings_assets_public_read ON storage.objects;
DROP POLICY IF EXISTS ljf_settings_assets_admin_insert ON storage.objects;
DROP POLICY IF EXISTS ljf_settings_assets_admin_update ON storage.objects;
DROP POLICY IF EXISTS ljf_settings_assets_admin_delete ON storage.objects;

CREATE POLICY ljf_settings_assets_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'settings-assets');

CREATE POLICY ljf_settings_assets_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'settings-assets'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY ljf_settings_assets_admin_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'settings-assets'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'settings-assets'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY ljf_settings_assets_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'settings-assets'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );
