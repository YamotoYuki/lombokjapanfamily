-- =============================================================================
-- Lombok-Japan Family CMS — Initial Schema, RLS, Storage
-- Apply in Supabase SQL Editor or via CLI:
--   supabase db push / supabase migration up
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('new', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sponsor_status AS ENUM (
    'proposal',
    'contracted',
    'production',
    'published',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RBAC: user_roles
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id),
  CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'editor', 'viewer'))
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- -----------------------------------------------------------------------------
-- Role helper (SECURITY DEFINER to avoid recursive RLS)
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- CMS tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT videos_youtube_id_unique UNIQUE (youtube_id)
);

CREATE INDEX IF NOT EXISTS idx_videos_published_at ON public.videos (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos (category);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON public.videos (is_featured);

CREATE TABLE IF NOT EXISTS public.post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  CONSTRAINT post_categories_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_post_categories_slug ON public.post_categories (slug);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.post_categories (id) ON DELETE SET NULL,
  status public.post_status NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  published_at TIMESTAMPTZ,
  CONSTRAINT posts_slug_unique UNIQUE (slug),
  CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts (category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts (published_at DESC);

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.gallery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  CONSTRAINT gallery_categories_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category_id UUID REFERENCES public.gallery_categories (id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_gallery_category_id ON public.gallery (category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_at ON public.gallery (uploaded_at DESC);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status public.contact_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT contacts_status_check CHECK (status IN ('new', 'in_progress', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts (status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts (email);

CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_family_profiles_display_order
  ON public.family_profiles (display_order ASC);

CREATE TABLE IF NOT EXISTS public.sns_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  CONSTRAINT sns_links_platform_unique UNIQUE (platform)
);

CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  project_name TEXT,
  contact_person TEXT,
  amount NUMERIC(14, 2),
  contract_date DATE,
  status public.sponsor_status NOT NULL DEFAULT 'proposal',
  youtube_url TEXT,
  CONSTRAINT sponsors_status_check CHECK (
    status IN ('proposal', 'contracted', 'production', 'published', 'completed')
  ),
  CONSTRAINT sponsors_amount_check CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors (status);
CREATE INDEX IF NOT EXISTS idx_sponsors_contract_date ON public.sponsors (contract_date DESC);

CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  pv INTEGER NOT NULL DEFAULT 0 CHECK (pv >= 0),
  uu INTEGER NOT NULL DEFAULT 0 CHECK (uu >= 0),
  avg_session NUMERIC(10, 2),
  bounce_rate NUMERIC(5, 2),
  CONSTRAINT analytics_cache_date_unique UNIQUE (date),
  CONSTRAINT analytics_cache_bounce_rate_check
    CHECK (bounce_rate IS NULL OR (bounce_rate >= 0 AND bounce_rate <= 100))
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_date ON public.analytics_cache (date DESC);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL,
  site_description TEXT,
  contact_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Seed single settings row (idempotent)
INSERT INTO public.settings (site_name, site_description, contact_email)
SELECT
  'Lombok-Japan Family',
  'Official YouTube channel website',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);

-- =============================================================================
-- Row Level Security
-- Base rules:
--   viewer  → SELECT
--   editor  → SELECT, INSERT, UPDATE
--   admin   → ALL (SELECT, INSERT, UPDATE, DELETE)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sns_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper macro pattern via repeated policies

-- profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  )
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

-- user_roles
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete ON public.user_roles;

CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

CREATE POLICY user_roles_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]))
  WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

CREATE POLICY user_roles_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

-- Generic CMS policy applicator via DO block
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'videos',
    'post_categories',
    'posts',
    'gallery_categories',
    'gallery',
    'contacts',
    'family_profiles',
    'sns_links',
    'sponsors',
    'analytics_cache',
    'settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(ARRAY[''admin'', ''editor'', ''viewer'']::public.app_role[]))',
      t || '_select', t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[]))',
      t || '_insert', t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[])) WITH CHECK (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[]))',
      t || '_update', t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(ARRAY[''admin'']::public.app_role[]))',
      t || '_delete', t
    );
  END LOOP;
END $$;

-- =============================================================================
-- Storage buckets + policies
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('gallery', 'gallery', TRUE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('posts', 'posts', TRUE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('attachments', 'attachments', FALSE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Clean existing storage policies for these buckets
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE 'ljf_%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Public read for public buckets
CREATE POLICY ljf_avatars_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY ljf_gallery_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'gallery');

CREATE POLICY ljf_posts_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'posts');

-- Attachments: authenticated roles can read
CREATE POLICY ljf_attachments_auth_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

-- Avatars: users manage own folder; editors/admins manage all
CREATE POLICY ljf_avatars_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
    )
  );

CREATE POLICY ljf_avatars_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(ARRAY['admin', 'editor']::public.app_role[])
    )
  );

CREATE POLICY ljf_avatars_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(ARRAY['admin']::public.app_role[])
    )
  );

-- gallery / posts / attachments write policies
CREATE POLICY ljf_gallery_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_gallery_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_gallery_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY ljf_posts_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'posts'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_posts_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'posts'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'posts'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_posts_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'posts'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY ljf_attachments_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_attachments_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor']::public.app_role[])
  );

CREATE POLICY ljf_attachments_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin']::public.app_role[])
  );

-- =============================================================================
-- Bootstrap note (run manually after creating first Auth user):
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<auth-user-uuid>', 'admin');
-- =============================================================================
