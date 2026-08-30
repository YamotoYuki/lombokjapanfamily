-- Announcements CMS (お知らせ)

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'announcement'
    CHECK (category IN ('announcement', 'video', 'event', 'update')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  featured_image TEXT,
  youtube_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_published_at
  ON public.announcements (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_is_published
  ON public.announcements (is_published);

CREATE INDEX IF NOT EXISTS idx_announcements_category
  ON public.announcements (category);

CREATE INDEX IF NOT EXISTS idx_announcements_is_featured
  ON public.announcements (is_featured)
  WHERE is_featured = TRUE;

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Staff policies (mirrors init.rbac loop style)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'announcements_staff_select'
  ) THEN
    CREATE POLICY announcements_staff_select ON public.announcements
      FOR SELECT TO authenticated
      USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'announcements_staff_insert'
  ) THEN
    CREATE POLICY announcements_staff_insert ON public.announcements
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'announcements_staff_update'
  ) THEN
    CREATE POLICY announcements_staff_update ON public.announcements
      FOR UPDATE TO authenticated
      USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]))
      WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'announcements_staff_delete'
  ) THEN
    CREATE POLICY announcements_staff_delete ON public.announcements
      FOR DELETE TO authenticated
      USING (public.has_role(ARRAY['admin']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'announcements_public_select'
  ) THEN
    CREATE POLICY announcements_public_select ON public.announcements
      FOR SELECT TO anon, authenticated
      USING (is_published = TRUE);
  END IF;
END $$;
