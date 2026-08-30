-- Seed official SNS URLs into Settings (do not overwrite existing non-empty values).
-- YouTube channel URL is left as-is when already set.

UPDATE public.settings
SET
  facebook_url = COALESCE(
    NULLIF(BTRIM(facebook_url), ''),
    'https://www.facebook.com/tamulombokjapan/'
  ),
  instagram_url = COALESCE(
    NULLIF(BTRIM(instagram_url), ''),
    'https://www.instagram.com/tamu.lj'
  ),
  tiktok_url = COALESCE(
    NULLIF(BTRIM(tiktok_url), ''),
    'https://www.tiktok.com/@lombokjapanfamily'
  ),
  youtube_channel_url = COALESCE(
    NULLIF(BTRIM(youtube_channel_url), ''),
    'https://www.youtube.com/@lombokjapanfamily'
  ),
  updated_at = timezone('utc', now())
WHERE id IS NOT NULL;
