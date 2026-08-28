-- STEP10: Google Analytics cache tables

-- Extend analytics_cache
ALTER TABLE public.analytics_cache
  ADD COLUMN IF NOT EXISTS sessions BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_session_duration NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Migrate legacy avg_session -> avg_session_duration when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'analytics_cache'
      AND column_name = 'avg_session'
  ) THEN
    UPDATE public.analytics_cache
    SET avg_session_duration = coalesce(avg_session_duration, avg_session, 0)
    WHERE avg_session_duration = 0 AND avg_session IS NOT NULL;
  END IF;
END $$;

-- Prefer bigint for pv/uu
DO $$
BEGIN
  ALTER TABLE public.analytics_cache
    ALTER COLUMN pv TYPE BIGINT USING pv::BIGINT;
  ALTER TABLE public.analytics_cache
    ALTER COLUMN uu TYPE BIGINT USING uu::BIGINT;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_analytics_cache_updated_at ON public.analytics_cache;
CREATE TRIGGER trg_analytics_cache_updated_at
BEFORE UPDATE ON public.analytics_cache
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.analytics_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  pv BIGINT NOT NULL DEFAULT 0,
  active_users BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT analytics_pages_date_path_unique UNIQUE (date, page_path)
);

CREATE INDEX IF NOT EXISTS idx_analytics_pages_date ON public.analytics_pages (date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pages_pv ON public.analytics_pages (pv DESC);

CREATE TABLE IF NOT EXISTS public.analytics_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  country TEXT NOT NULL,
  active_users BIGINT NOT NULL DEFAULT 0,
  sessions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT analytics_countries_date_country_unique UNIQUE (date, country)
);

CREATE INDEX IF NOT EXISTS idx_analytics_countries_date ON public.analytics_countries (date DESC);

CREATE TABLE IF NOT EXISTS public.analytics_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  device_category TEXT NOT NULL,
  active_users BIGINT NOT NULL DEFAULT 0,
  sessions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT analytics_devices_date_device_unique UNIQUE (date, device_category)
);

CREATE INDEX IF NOT EXISTS idx_analytics_devices_date ON public.analytics_devices (date DESC);

CREATE TABLE IF NOT EXISTS public.analytics_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT,
  medium TEXT,
  sessions BIGINT NOT NULL DEFAULT 0,
  active_users BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT analytics_sources_date_source_medium_unique UNIQUE (date, source, medium)
);

CREATE INDEX IF NOT EXISTS idx_analytics_sources_date ON public.analytics_sources (date DESC);

ALTER TABLE public.analytics_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sources ENABLE ROW LEVEL SECURITY;

-- Staff SELECT for all roles; admin ALL for writes
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'analytics_cache',
    'analytics_pages',
    'analytics_countries',
    'analytics_devices',
    'analytics_sources'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(ARRAY[''admin'', ''editor'', ''viewer'']::public.app_role[]))',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(ARRAY[''admin'']::public.app_role[])) WITH CHECK (public.has_role(ARRAY[''admin'']::public.app_role[]))',
      t || '_admin_all', t
    );
  END LOOP;
END $$;

-- Future extensions
-- TODO: Google Search Console連携
-- TODO: 検索キーワード詳細分析
-- TODO: 記事別CV分析
-- TODO: お問い合わせCV率分析
-- TODO: YouTube動画との相関分析
-- TODO: AIによるアクセス改善提案
-- TODO: 自動レポートPDF出力
-- TODO: 週次メールレポート
