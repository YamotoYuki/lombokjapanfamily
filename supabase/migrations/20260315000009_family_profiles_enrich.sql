-- Enrich family_profiles for richer public Family pages (additive only).

ALTER TABLE public.family_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS hometown TEXT,
  ADD COLUMN IF NOT EXISTS current_location TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT,
  ADD COLUMN IF NOT EXISTS hobbies TEXT,
  ADD COLUMN IF NOT EXISTS favorite_food TEXT,
  ADD COLUMN IF NOT EXISTS favorite_japan TEXT,
  ADD COLUMN IF NOT EXISTS favorite_indonesia TEXT,
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_family_profiles_show_on_home
  ON public.family_profiles (show_on_home)
  WHERE show_on_home = TRUE;
