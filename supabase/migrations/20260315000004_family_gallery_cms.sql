-- STEP8: Family profiles + Gallery CMS extensions

-- ---------------------------------------------------------------------------
-- family_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.family_profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS x_url TEXT,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_family_profiles_is_visible
  ON public.family_profiles (is_visible);

DROP TRIGGER IF EXISTS trg_family_profiles_updated_at ON public.family_profiles;
CREATE TRIGGER trg_family_profiles_updated_at
BEFORE UPDATE ON public.family_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- gallery_categories
-- ---------------------------------------------------------------------------
ALTER TABLE public.gallery_categories
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Backfill slug from name when missing
UPDATE public.gallery_categories
SET slug = lower(regexp_replace(coalesce(name, 'category'), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Ensure uniqueness for existing rows
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  n INT;
BEGIN
  FOR r IN
    SELECT id, slug
    FROM public.gallery_categories
    ORDER BY created_at NULLS LAST, id
  LOOP
    base := NULLIF(trim(both '-' FROM r.slug), '');
    IF base IS NULL THEN
      base := 'category';
    END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (
      SELECT 1
      FROM public.gallery_categories
      WHERE slug = candidate AND id <> r.id
    ) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    UPDATE public.gallery_categories SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.gallery_categories ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gallery_categories_slug_unique'
  ) THEN
    ALTER TABLE public.gallery_categories
      ADD CONSTRAINT gallery_categories_slug_unique UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gallery_categories_display_order
  ON public.gallery_categories (display_order ASC);

DROP TRIGGER IF EXISTS trg_gallery_categories_updated_at ON public.gallery_categories;
CREATE TRIGGER trg_gallery_categories_updated_at
BEFORE UPDATE ON public.gallery_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Seed default categories
INSERT INTO public.gallery_categories (name, slug, description, display_order)
VALUES
  ('旅行', 'travel', '旅先の風景・ロケ', 1),
  ('日常', 'daily', '日常のワンシーン', 2),
  ('イベント', 'event', 'イベント・撮影', 3),
  ('子供', 'kids', 'キッズ・子育て', 4),
  ('インドネシア', 'indonesia', 'ロンボク・インドネシア', 5),
  ('日本', 'japan', '日本でのシーン', 6),
  ('家族', 'family', 'ファミリーショット', 7),
  ('Vlog', 'vlog', 'Vlog関連ビジュアル', 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- gallery
-- ---------------------------------------------------------------------------
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS taken_at DATE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Migrate uploaded_at -> created_at when needed
UPDATE public.gallery
SET created_at = uploaded_at
WHERE uploaded_at IS NOT NULL
  AND (created_at IS NULL OR created_at = timezone('utc', now()));

CREATE INDEX IF NOT EXISTS idx_gallery_is_visible ON public.gallery (is_visible);
CREATE INDEX IF NOT EXISTS idx_gallery_is_featured ON public.gallery (is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_display_order ON public.gallery (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_gallery_taken_at ON public.gallery (taken_at DESC);

DROP TRIGGER IF EXISTS trg_gallery_updated_at ON public.gallery;
CREATE TRIGGER trg_gallery_updated_at
BEFORE UPDATE ON public.gallery
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public read RLS (visible only) + tighten staff policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS family_profiles_public_select ON public.family_profiles;
CREATE POLICY family_profiles_public_select ON public.family_profiles
  FOR SELECT TO anon, authenticated
  USING (is_visible = TRUE);

DROP POLICY IF EXISTS gallery_public_select ON public.gallery;
CREATE POLICY gallery_public_select ON public.gallery
  FOR SELECT TO anon, authenticated
  USING (is_visible = TRUE);

DROP POLICY IF EXISTS gallery_categories_public_select ON public.gallery_categories;
CREATE POLICY gallery_categories_public_select ON public.gallery_categories
  FOR SELECT TO anon, authenticated
  USING (TRUE);

-- Align staff write: admin ALL / editor SELECT+INSERT+UPDATE / viewer SELECT
-- (existing generic policies already cover authenticated staff; keep as-is)

-- Soft-tighten gallery bucket size hint (app enforces 5MB)
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'gallery';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';
