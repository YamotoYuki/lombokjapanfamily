-- =============================================================================
-- announcements + notification_banners + first official seed
-- Compatible with current remote schema:
--   - uses public.update_timestamp() (NOT set_updated_at)
--   - requires public.has_role(public.app_role[])
-- Paste into Supabase SQL Editor and Run.
-- Safe to re-run.
-- =============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.update_timestamp()') IS NULL THEN
    RAISE EXCEPTION 'public.update_timestamp() does not exist';
  END IF;

  IF to_regprocedure('public.has_role(public.app_role[])') IS NULL THEN
    RAISE EXCEPTION 'public.has_role(public.app_role[]) does not exist';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------
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

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS content_id TEXT,
  ADD COLUMN IF NOT EXISTS publish_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_end_at TIMESTAMPTZ;

UPDATE public.announcements
SET
  title_ja = COALESCE(NULLIF(BTRIM(title_ja), ''), NULLIF(BTRIM(title), ''), ''),
  content_ja = COALESCE(NULLIF(BTRIM(content_ja), ''), content, '')
WHERE TRUE;

ALTER TABLE public.announcements
  ALTER COLUMN title_ja SET DEFAULT '',
  ALTER COLUMN content_ja SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_announcements_published_at
  ON public.announcements (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_is_published
  ON public.announcements (is_published);

CREATE INDEX IF NOT EXISTS idx_announcements_category
  ON public.announcements (category);

CREATE INDEX IF NOT EXISTS idx_announcements_is_featured
  ON public.announcements (is_featured)
  WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_announcements_publish_start_at
  ON public.announcements (publish_start_at);

CREATE INDEX IF NOT EXISTS idx_announcements_publish_end_at
  ON public.announcements (publish_end_at);

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

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

-- ---------------------------------------------------------------------------
-- notification_banners
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
EXECUTE FUNCTION public.update_timestamp();

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

-- ---------------------------------------------------------------------------
-- Seed: first official announcement + notification banner
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_now TIMESTAMPTZ := timezone('utc', now());
  v_announcement_id UUID;
  v_title_ja TEXT := 'Lombok-Japan Family 公式サイトを公開しました';
  v_title_en TEXT := 'Lombok-Japan Family Official Website is Now Live';
  v_title_id TEXT := 'Website Resmi Lombok-Japan Family Telah Diluncurkan';
  v_content_ja TEXT := $ja$いつも Lombok-Japan Family を応援していただき、ありがとうございます。

このたび、Lombok-Japan Family の公式ウェブサイトを公開しました。

このサイトでは、

・最新のYouTube動画
・家族紹介（Family）
・ギャラリー
・お知らせ
・お問い合わせ

などをご覧いただけます。

日本とインドネシアをつなぐ家族として、
日々の暮らしや文化、旅行の様子を発信していきます。

今後も動画やお知らせを更新していきますので、
ぜひチェックしてください。

これからも Lombok-Japan Family をよろしくお願いいたします。$ja$;
  v_content_en TEXT := $en$Thank you for supporting Lombok-Japan Family.

We are happy to announce the launch of our official website.

Here you can find:

• Latest YouTube videos
• Family profiles
• Photo gallery
• Announcements
• Contact information

As a family connecting Japan and Indonesia, we look forward to sharing our daily life, culture, travel experiences, and family stories.

We will continue updating the website with new content and announcements.

Thank you for your continued support of Lombok-Japan Family.$en$;
  v_content_id TEXT := $id$Terima kasih telah mendukung Lombok-Japan Family.

Kami dengan senang hati mengumumkan bahwa website resmi Lombok-Japan Family kini telah tersedia.

Di website ini, Anda dapat menemukan:

• Video YouTube terbaru
• Profil keluarga
• Galeri foto
• Pengumuman terbaru
• Informasi kontak

Sebagai keluarga yang menghubungkan Jepang dan Indonesia, kami ingin berbagi kehidupan sehari-hari, budaya, perjalanan, dan cerita keluarga kami.

Kami akan terus memperbarui website ini dengan konten dan informasi terbaru.

Terima kasih atas dukungan Anda kepada Lombok-Japan Family.$id$;
BEGIN
  SELECT id INTO v_announcement_id
  FROM public.announcements
  WHERE title_ja = v_title_ja
  LIMIT 1;

  IF v_announcement_id IS NULL THEN
    INSERT INTO public.announcements (
      title,
      content,
      title_ja,
      title_en,
      title_id,
      content_ja,
      content_en,
      content_id,
      category,
      is_published,
      is_featured,
      published_at,
      publish_start_at,
      publish_end_at
    ) VALUES (
      v_title_ja,
      v_content_ja,
      v_title_ja,
      v_title_en,
      v_title_id,
      v_content_ja,
      v_content_en,
      v_content_id,
      'announcement',
      TRUE,
      TRUE,
      v_now,
      v_now,
      NULL
    )
    RETURNING id INTO v_announcement_id;
  ELSE
    UPDATE public.announcements
    SET
      title = v_title_ja,
      content = v_content_ja,
      title_ja = v_title_ja,
      title_en = v_title_en,
      title_id = v_title_id,
      content_ja = v_content_ja,
      content_en = v_content_en,
      content_id = v_content_id,
      category = 'announcement',
      is_published = TRUE,
      is_featured = TRUE,
      published_at = COALESCE(published_at, v_now),
      publish_start_at = COALESCE(publish_start_at, v_now),
      publish_end_at = NULL,
      updated_at = v_now
    WHERE id = v_announcement_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.notification_banners
    WHERE title_ja = v_title_ja
  ) THEN
    INSERT INTO public.notification_banners (
      title_ja,
      title_en,
      title_id,
      message_ja,
      message_en,
      message_id,
      link_url,
      publish_start_at,
      publish_end_at,
      is_active
    ) VALUES (
      v_title_ja,
      v_title_en,
      v_title_id,
      '公式ウェブサイトを公開しました。最新動画・Family・ギャラリーなどをご覧いただけます。',
      'Our official website is now live. Explore videos, Family, gallery, and more.',
      'Website resmi kami telah diluncurkan. Temukan video, Family, galeri, dan lainnya.',
      '/announcements/' || v_announcement_id::text,
      v_now,
      NULL,
      TRUE
    );
  ELSE
    UPDATE public.notification_banners
    SET
      title_en = v_title_en,
      title_id = v_title_id,
      message_ja = '公式ウェブサイトを公開しました。最新動画・Family・ギャラリーなどをご覧いただけます。',
      message_en = 'Our official website is now live. Explore videos, Family, gallery, and more.',
      message_id = 'Website resmi kami telah diluncurkan. Temukan video, Family, galeri, dan lainnya.',
      link_url = '/announcements/' || v_announcement_id::text,
      publish_start_at = COALESCE(publish_start_at, v_now),
      publish_end_at = NULL,
      is_active = TRUE,
      updated_at = v_now
    WHERE title_ja = v_title_ja;
  END IF;
END $$;

SELECT
  a.id AS announcement_id,
  a.is_published,
  a.is_featured,
  a.publish_start_at,
  a.publish_end_at,
  b.id AS banner_id,
  b.is_active,
  b.link_url
FROM public.announcements a
LEFT JOIN public.notification_banners b
  ON b.title_ja = a.title_ja
WHERE a.title_ja = 'Lombok-Japan Family 公式サイトを公開しました';
