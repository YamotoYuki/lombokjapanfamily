-- STEP5: Extend videos table for YouTube CMS

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS channel_title TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS likes BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Prefer bigint for views (safe cast from integer)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'videos'
      AND column_name = 'views'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.videos
      ALTER COLUMN views TYPE BIGINT USING views::BIGINT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_is_visible ON public.videos (is_visible);
CREATE INDEX IF NOT EXISTS idx_videos_show_on_home ON public.videos (show_on_home);
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON public.videos (display_order ASC);

DROP TRIGGER IF EXISTS trg_videos_updated_at ON public.videos;
CREATE TRIGGER trg_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
