-- STEP11: User management, RBAC hardening, audit logs

DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles (deleted_at);

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Ensure FK to profiles as well (user_id already references auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_profile_fk'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_profile_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS: profiles / user_roles / settings / audit
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin']::public.app_role[])
  )
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(ARRAY['admin']::public.app_role[])
  );

CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete ON public.user_roles;

CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY user_roles_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY user_roles_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

DROP POLICY IF EXISTS settings_select ON public.settings;
DROP POLICY IF EXISTS settings_insert ON public.settings;
DROP POLICY IF EXISTS settings_update ON public.settings;
DROP POLICY IF EXISTS settings_delete ON public.settings;

CREATE POLICY settings_select ON public.settings
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY settings_insert ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY settings_update ON public.settings
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]))
  WITH CHECK (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY settings_delete ON public.settings
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin', 'editor']::public.app_role[]));

CREATE POLICY audit_logs_delete ON public.audit_logs
  FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']::public.app_role[]));

-- Content tables: viewer read-only, editor write, admin full
-- (re-assert generic policies for core CMS tables)
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'videos',
    'post_categories',
    'posts',
    'gallery_categories',
    'gallery',
    'contacts',
    'family_profiles',
    'sponsors',
    'analytics_cache',
    'analytics_pages',
    'analytics_countries',
    'analytics_devices',
    'analytics_sources'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(ARRAY[''admin'', ''editor'', ''viewer'']::public.app_role[]))',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[]))',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[])) WITH CHECK (public.has_role(ARRAY[''admin'', ''editor'']::public.app_role[]))',
      t || '_update', t
    );
    -- Hard delete: admin only. Soft-delete via UPDATE remains available to editors.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(ARRAY[''admin'']::public.app_role[]))',
      t || '_delete', t
    );
  END LOOP;
END $$;

-- Assign default viewer role for profiles missing a role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'viewer'::public.app_role
FROM public.profiles p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;
