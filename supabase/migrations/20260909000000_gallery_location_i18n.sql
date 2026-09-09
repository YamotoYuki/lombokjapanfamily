-- Gallery: multilingual location field (ja / en / id), matching the
-- title/description i18n pattern added in 20260331000001_cms_i18n_fields.sql.
-- Additive only: adds nullable TEXT columns and backfills location_ja from
-- the existing legacy `location` column. No data is modified or removed.
-- Idempotent: safe to re-run.

ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS location_ja TEXT,
  ADD COLUMN IF NOT EXISTS location_en TEXT,
  ADD COLUMN IF NOT EXISTS location_id TEXT;

UPDATE public.gallery
SET location_ja = COALESCE(NULLIF(BTRIM(location_ja), ''), NULLIF(BTRIM(location), ''))
WHERE TRUE;
