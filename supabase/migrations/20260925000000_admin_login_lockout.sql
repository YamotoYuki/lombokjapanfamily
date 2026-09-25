-- Server-side lockout bookkeeping for admin login: 5 consecutive failed
-- attempts locks that email out for 1 hour. Keyed by submitted email (not
-- user_id) because the lockout check runs BEFORE Supabase Auth is called,
-- so a user_id isn't known yet — this also means a non-existent email
-- accumulates/locks the same way a real one does, which avoids leaking
-- account existence via lockout behavior.
--
-- Only ever read/written by the backend's service-role client (which
-- bypasses RLS). No policies are granted to authenticated/anon, so this
-- table is unreachable from the browser regardless.

CREATE TABLE IF NOT EXISTS public.login_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_login_lockouts_email ON public.login_lockouts (email);

DROP TRIGGER IF EXISTS trg_login_lockouts_updated_at ON public.login_lockouts;
CREATE TRIGGER trg_login_lockouts_updated_at
BEFORE UPDATE ON public.login_lockouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.login_lockouts ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: default-deny for authenticated/anon.
