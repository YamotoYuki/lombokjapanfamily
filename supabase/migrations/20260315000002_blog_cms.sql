-- STEP6: Blog CMS schema extensions

-- Extend post_categories
ALTER TABLE public.post_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

DROP TRIGGER IF EXISTS trg_post_categories_updated_at ON public.post_categories;
CREATE TRIGGER trg_post_categories_updated_at
BEFORE UPDATE ON public.post_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Extend posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

-- Expand post_status enum to include archived.
-- NOTE: a newly added enum label cannot be used as enum in the same transaction,
-- so the CHECK below compares status::text (not enum literals).
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'archived';

-- Expand status check to include archived
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status::text IN ('draft', 'scheduled', 'published', 'archived'));

-- Ensure content is not null for new rows (existing may be null; backfill empty)
UPDATE public.posts SET content = '' WHERE content IS NULL;
ALTER TABLE public.posts ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.posts ALTER COLUMN content SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON public.posts (created_by);

-- Tags
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT post_tags_slug_unique UNIQUE (slug),
  CONSTRAINT post_tags_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_slug ON public.post_tags (slug);

CREATE TABLE IF NOT EXISTS public.post_tag_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.post_tags (id) ON DELETE CASCADE,
  CONSTRAINT post_tag_relations_unique UNIQUE (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tag_relations_post_id ON public.post_tag_relations (post_id);
CREATE INDEX IF NOT EXISTS idx_post_tag_relations_tag_id ON public.post_tag_relations (tag_id);

ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tag_relations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Apply same CMS RBAC pattern
  DROP POLICY IF EXISTS post_tags_select ON public.post_tags;
  DROP POLICY IF EXISTS post_tags_insert ON public.post_tags;
  DROP POLICY IF EXISTS post_tags_update ON public.post_tags;
  DROP POLICY IF EXISTS post_tags_delete ON public.post_tags;

  CREATE POLICY post_tags_select ON public.post_tags
    FOR SELECT TO authenticated
    USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));

  CREATE POLICY post_tags_insert ON public.post_tags
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

  CREATE POLICY post_tags_update ON public.post_tags
    FOR UPDATE TO authenticated
    USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]))
    WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

  CREATE POLICY post_tags_delete ON public.post_tags
    FOR DELETE TO authenticated
    USING (public.has_role(ARRAY['admin']::public.app_role[]));

  DROP POLICY IF EXISTS post_tag_relations_select ON public.post_tag_relations;
  DROP POLICY IF EXISTS post_tag_relations_insert ON public.post_tag_relations;
  DROP POLICY IF EXISTS post_tag_relations_update ON public.post_tag_relations;
  DROP POLICY IF EXISTS post_tag_relations_delete ON public.post_tag_relations;

  CREATE POLICY post_tag_relations_select ON public.post_tag_relations
    FOR SELECT TO authenticated
    USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));

  CREATE POLICY post_tag_relations_insert ON public.post_tag_relations
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

  CREATE POLICY post_tag_relations_update ON public.post_tag_relations
    FOR UPDATE TO authenticated
    USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]))
    WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

  CREATE POLICY post_tag_relations_delete ON public.post_tag_relations
    FOR DELETE TO authenticated
    USING (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));
END $$;

-- Seed default categories (idempotent by slug)
INSERT INTO public.post_categories (name, slug, description)
SELECT v.name, v.slug, v.description
FROM (
  VALUES
    ('旅行', 'travel', '旅行・ロケ関連'),
    ('日常', 'daily', 'ファミリーの日常'),
    ('イベント', 'event', 'イベント・コラボ'),
    ('子供', 'kids', '子育て・子ども関連'),
    ('インドネシア', 'indonesia', 'インドネシア文化・生活'),
    ('日本', 'japan', '日本文化・生活'),
    ('国際結婚', 'international-marriage', '国際家族の視点'),
    ('文化', 'culture', '文化交流'),
    ('Vlog', 'vlog', '動画制作・Vlog'),
    ('お知らせ', 'news', '公式お知らせ')
) AS v(name, slug, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.post_categories c WHERE c.slug = v.slug
);
