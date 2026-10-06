import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { apiClient } from '@/services/apiClient';
import { supabase } from '@/services/supabase';
import type { AppRole, Profile } from '@/types';

type LoginApiEnvelope = {
  ok: boolean;
  message?: string;
  code?: string;
  data?: { access_token: string; refresh_token: string };
};

/**
 * Why the user was signed out / cannot proceed. Mirrors the backend's
 * stable error codes (backend/utils/auth.py). Translate with
 * `authNoticeKey()` — the backend's own message is Japanese-only.
 */
export type AuthNotice =
  | 'role_missing'
  | 'account_suspended'
  | 'account_deleted'
  | 'auth_unavailable';

const ACCOUNT_DENIAL_CODES: ReadonlySet<string> = new Set([
  'role_missing',
  'account_suspended',
  'account_deleted',
]);

// eslint-disable-next-line react-refresh/only-export-components
export function authNoticeKey(notice: AuthNotice): string {
  switch (notice) {
    case 'role_missing':
      return 'admin.auth.roleMissing';
    case 'account_suspended':
      return 'admin.auth.accountSuspended';
    case 'account_deleted':
      return 'admin.auth.accountDeleted';
    case 'auth_unavailable':
      return 'admin.auth.unavailable';
  }
}

type AxiosLikeError = {
  response?: { status?: number; data?: { message?: string; code?: string } };
  message?: string;
};

/** Matches the getErrorMessage() convention already used in the *Api.ts services. */
function loginErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as AxiosLikeError;
    if (maybeAxios.response?.data?.message) {
      return maybeAxios.response.data.message;
    }
    if (maybeAxios.message) {
      return maybeAxios.message;
    }
  }
  return fallback;
}

/**
 * The four outcomes of asking the backend who we are. Kept distinct on
 * purpose: only `denied` / `unauthenticated` may sign the user out — a
 * transient outage (`unavailable`) must never be read as "no permission".
 */
type SessionCheck =
  | { kind: 'ok'; profile: Profile; role: AppRole }
  | { kind: 'denied'; notice: AuthNotice }
  | { kind: 'unauthenticated' }
  | { kind: 'unavailable' };

const APP_ROLES: ReadonlySet<string> = new Set(['admin', 'editor', 'viewer']);

async function checkSession(accessToken: string): Promise<SessionCheck> {
  try {
    const { data } = await apiClient.get<{
      ok: boolean;
      data?: { profile: Profile; role: string };
    }>('/auth/session', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const role = data.data?.role;
    if (!data.ok || !data.data || !role || !APP_ROLES.has(role)) {
      return { kind: 'denied', notice: 'role_missing' };
    }
    return { kind: 'ok', profile: data.data.profile, role: role as AppRole };
  } catch (err) {
    const response = (err as AxiosLikeError).response;
    if (!response) {
      // Network error / timeout / CORS: we simply don't know.
      return { kind: 'unavailable' };
    }
    if (response.status === 401) return { kind: 'unauthenticated' };
    if (response.status === 403) {
      const code = response.data?.code ?? '';
      return {
        kind: 'denied',
        notice: ACCOUNT_DENIAL_CODES.has(code) ? (code as AuthNotice) : 'role_missing',
      };
    }
    // 503 auth_unavailable, other 5xx, 429, …
    return { kind: 'unavailable' };
  }
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  /** Current session MFA: verified TOTP/phone factors (null = unknown). */
  mfaEnabled: boolean | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * Account-level reason shown on the login screen after a forced sign-out
   * (role missing / suspended / deleted). Survives the sign-out.
   */
  authNotice: AuthNotice | null;
  /**
   * The last role/status check could not reach the backend. The session is
   * kept; the UI asks the user to reload instead of logging them out.
   */
  authUnavailable: boolean;
  clearAuthNotice: () => void;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; notice?: AuthNotice }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AppRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMfaEnabled(): Promise<boolean | null> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.warn('[auth] MFA listFactors failed', error.message);
      return null;
    }
    const totp = data?.totp ?? [];
    const phone = data?.phone ?? [];
    return [...totp, ...phone].some((factor) => factor.status === 'verified');
  } catch (err) {
    console.warn('[auth] MFA lookup error', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);
  const [authUnavailable, setAuthUnavailable] = useState(false);
  // Several auth events can trigger overlapping checks (init + the SDK's
  // INITIAL_SESSION, token refresh, …); only the newest may write state.
  const hydrateSeq = useRef(0);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setMfaEnabled(null);
    setAuthUnavailable(false);
  }, []);

  /**
   * Resolve role/status for `nextSession` via the backend — the same check
   * every API applies — instead of reading profiles/user_roles directly.
   * Returns false when the session was rejected and signed out.
   */
  const hydrateUser = useCallback(async (nextSession: Session | null) => {
    const seq = ++hydrateSeq.current;
    if (!nextSession?.user) {
      setProfile(null);
      setRole(null);
      setMfaEnabled(null);
      setAuthUnavailable(false);
      return { ok: true as const };
    }

    const result = await checkSession(nextSession.access_token);
    // A newer check is in flight; it owns state and isLoading.
    if (seq !== hydrateSeq.current) return { ok: true as const, superseded: true };

    switch (result.kind) {
      case 'ok': {
        setProfile(result.profile);
        setRole(result.role);
        setAuthUnavailable(false);
        const nextMfa = await fetchMfaEnabled();
        if (seq === hydrateSeq.current) setMfaEnabled(nextMfa);
        return { ok: true as const };
      }
      case 'unavailable':
        // Keep the session and whatever role we already knew; the UI shows
        // a "reload" prompt. Never treat an outage as "no permission".
        console.warn('[auth] could not verify role/status; keeping session');
        setAuthUnavailable(true);
        return { ok: true as const };
      case 'denied':
        console.warn('[auth] account not allowed; signing out', result.notice);
        setAuthNotice(result.notice);
        await supabase.auth.signOut();
        return { ok: false as const };
      case 'unauthenticated':
        console.warn('[auth] session rejected by backend; signing out');
        await supabase.auth.signOut();
        return { ok: false as const };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('[auth] getSession failed', error.message);
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      const result = await hydrateUser(data.session);
      if (!mounted) return;
      if (!result.ok) {
        clearAuthState();
      }
      if (!('superseded' in result)) setIsLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // No setIsLoading(true) here: this fires on every auth event, including
      // a same-user re-sign-in (e.g. AccountPage verifying the current
      // password before a change) or a routine token refresh — not just an
      // actual sign-in/sign-out. Flipping isLoading briefly unmounts every
      // protected route (ProtectedRoute/RequireAuth/RequireAdmin/
      // RequireEditor all gate on it), wiping the page's local state — which
      // was silently discarding AccountPage's "password changed" success
      // message right as it was set. isLoading stays reserved for the one
      // real "do we know yet if there's a session" gap, handled by init()
      // above; session/user below still update immediately either way.
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // Deferred out of the callback: Supabase holds its auth lock while
      // this listener runs, and hydrateUser's API call reads the session
      // (apiClient interceptor), which would wait on that same lock.
      setTimeout(() => {
        void (async () => {
          const result = await hydrateUser(nextSession);
          if (!result.ok) {
            clearAuthState();
          }
          if (mounted && !('superseded' in result)) setIsLoading(false);
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, clearAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthNotice(null);
    // Routed through the backend (not supabase.auth.signInWithPassword()
    // directly) so failed attempts can be tracked and locked out
    // server-side — a client can't be trusted to police its own retries.
    // The backend still performs the same Supabase Auth password check; on
    // success it hands back a normal session, which we adopt below via
    // setSession() exactly as the SDK's own docs describe for a
    // server-issued session. onAuthStateChange (already wired up above)
    // picks up the resulting SIGNED_IN event and hydrates profile/role as
    // it always has.
    try {
      const { data } = await apiClient.post<LoginApiEnvelope>('/auth/login', {
        email: email.trim(),
        password,
      });

      if (!data.ok || !data.data) {
        setIsLoading(false);
        return { error: data.message || 'ログインに失敗しました' };
      }

      // last_login_at is recorded by the backend login itself (service
      // role); the browser no longer writes profiles directly.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
      });
      if (sessionError) {
        setIsLoading(false);
        return { error: sessionError.message };
      }

      return { error: null };
    } catch (err) {
      setIsLoading(false);
      const response = (err as AxiosLikeError).response;
      const code = response?.data?.code ?? '';
      if (response?.status === 403 && ACCOUNT_DENIAL_CODES.has(code)) {
        return {
          error: loginErrorMessage(err, 'ログインに失敗しました'),
          notice: code as AuthNotice,
        };
      }
      if (response?.status === 503 && code === 'auth_unavailable') {
        return {
          error: loginErrorMessage(err, 'ログインに失敗しました'),
          notice: 'auth_unavailable' as const,
        };
      }
      return { error: loginErrorMessage(err, 'ログインに失敗しました') };
    }
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] signOut failed', error.message);
    }
    clearAuthState();
  }, [clearAuthState]);

  // No role = no access. (This used to fall back to "viewer", which let a
  // role-less account into the admin UI.)
  const hasRole = useCallback(
    (...roles: AppRole[]) => role !== null && roles.includes(role),
    [role],
  );

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUser(data.user);
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const result = await hydrateUser(sessionData.session);
    if (!result.ok) {
      clearAuthState();
    }
  }, [hydrateUser, clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      role,
      mfaEnabled,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      authNotice,
      authUnavailable,
      clearAuthNotice,
      signIn,
      signOut,
      hasRole,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      role,
      mfaEnabled,
      isLoading,
      authNotice,
      authUnavailable,
      clearAuthNotice,
      signIn,
      signOut,
      hasRole,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* Fast Refresh: co-located hook is the established app pattern. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
