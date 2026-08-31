-- Multilingual CMS fields for public nav language (ja / en / id)

-- Gallery items
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS description_ja TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_id TEXT;

UPDATE public.gallery
SET
  title_ja = COALESCE(NULLIF(BTRIM(title_ja), ''), NULLIF(BTRIM(title), '')),
  description_ja = COALESCE(NULLIF(BTRIM(description_ja), ''), description)
WHERE TRUE;

-- Blog posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS content_id TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_ja TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_id TEXT;

UPDATE public.posts
SET
  title_ja = COALESCE(NULLIF(BTRIM(title_ja), ''), NULLIF(BTRIM(title), ''), ''),
  content_ja = COALESCE(NULLIF(BTRIM(content_ja), ''), content, ''),
  excerpt_ja = COALESCE(NULLIF(BTRIM(excerpt_ja), ''), excerpt)
WHERE TRUE;

-- Family profiles: localized free-text bag (bio + extras values)
ALTER TABLE public.family_profiles
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
