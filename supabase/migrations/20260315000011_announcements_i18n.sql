-- Announcements multilingual fields (ja / en / id)

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS content_id TEXT;

-- Backfill from legacy title/content columns when present.
UPDATE public.announcements
SET
  title_ja = COALESCE(NULLIF(BTRIM(title_ja), ''), NULLIF(BTRIM(title), ''), ''),
  content_ja = COALESCE(NULLIF(BTRIM(content_ja), ''), content, '')
WHERE TRUE;

ALTER TABLE public.announcements
  ALTER COLUMN title_ja SET DEFAULT '',
  ALTER COLUMN content_ja SET DEFAULT '';
