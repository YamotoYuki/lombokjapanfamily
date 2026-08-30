-- Announcement scheduled publish window + Notification banners

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS publish_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_end_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_announcements_publish_start_at
  ON public.announcements (publish_start_at);

CREATE INDEX IF NOT EXISTS idx_announcements_publish_end_at
  ON public.announcements (publish_end_at);

-- ---------------------------------------------------------------------------
-- notification_banners (TOP Hero 下の通知バナー)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ja TEXT NOT NULL DEFAULT '',
  title_en TEXT,
  title_id TEXT,
  message_ja TEXT NOT NULL DEFAULT '',
  message_en TEXT,
  message_id TEXT,
  link_url TEXT,
  publish_start_at TIMESTAMPTZ,
  publish_end_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notification_banners_is_active
  ON public.notification_banners (is_active);

CREATE INDEX IF NOT EXISTS idx_notification_banners_publish_window
  ON public.notification_banners (publish_start_at, publish_end_at);

DROP TRIGGER IF EXISTS trg_notification_banners_updated_at ON public.notification_banners;
CREATE TRIGGER trg_notification_banners_updated_at
BEFORE UPDATE ON public.notification_banners
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_banners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_banners'
      AND policyname = 'notification_banners_staff_select'
  ) THEN
    CREATE POLICY notification_banners_staff_select ON public.notification_banners
      FOR SELECT TO authenticated
      USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_banners'
      AND policyname = 'notification_banners_staff_insert'
  ) THEN
    CREATE POLICY notification_banners_staff_insert ON public.notification_banners
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_banners'
      AND policyname = 'notification_banners_staff_update'
  ) THEN
    CREATE POLICY notification_banners_staff_update ON public.notification_banners
      FOR UPDATE TO authenticated
      USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]))
      WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_banners'
      AND policyname = 'notification_banners_staff_delete'
  ) THEN
    CREATE POLICY notification_banners_staff_delete ON public.notification_banners
      FOR DELETE TO authenticated
      USING (public.has_role(ARRAY['admin']::public.app_role[]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_banners'
      AND policyname = 'notification_banners_public_select'
  ) THEN
    CREATE POLICY notification_banners_public_select ON public.notification_banners
      FOR SELECT TO anon, authenticated
      USING (is_active = TRUE);
  END IF;
END $$;
