import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { AppRole, Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  /** Current session MFA: verified TOTP/phone factors (null = unknown). */
  mfaEnabled: boolean | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AppRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isProfileAllowed(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.deleted_at) return false;
  const status = profile.status ?? 'active';
  return status === 'active';
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[auth] failed to load profile', error.message);
    return null;
  }

  return (data as Profile | null) ?? null;
}

async function fetchRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[auth] failed to load role', error.message);
    return 'viewer';
  }

  const row = data as { role: AppRole } | null;
  return row?.role ?? 'viewer';
}

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

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setMfaEnabled(null);
  }, []);

  const hydrateUser = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      setRole(null);
      setMfaEnabled(null);
      return { ok: true as const };
    }

    const [nextProfile, nextRole, nextMfa] = await Promise.all([
      fetchProfile(nextUser.id),
      fetchRole(nextUser.id),
      fetchMfaEnabled(),
    ]);

    if (!isProfileAllowed(nextProfile)) {
      console.warn('[auth] profile inactive or deleted; signing out');
      await supabase.auth.signOut();
      setProfile(null);
      setRole(null);
      setMfaEnabled(null);
      return { ok: false as const };
    }

    setProfile(nextProfile);
    setRole(nextRole);
    setMfaEnabled(nextMfa);
    return { ok: true as const };
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
      const result = await hydrateUser(data.session?.user ?? null);
      if (!mounted) return;
      if (!result.ok) {
        clearAuthState();
      }
      setIsLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void (async () => {
        const result = await hydrateUser(nextSession?.user ?? null);
        if (!result.ok) {
          clearAuthState();
        }
        if (mounted) setIsLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, clearAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    const userId = data.user?.id;
    if (userId) {
      void supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] signOut failed', error.message);
    }
    clearAuthState();
  }, [clearAuthState]);

  const hasRole = useCallback(
    (...roles: AppRole[]) => {
      const effective = role ?? 'viewer';
      return roles.includes(effective);
    },
    [role],
  );

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const nextUser = data.user ?? null;
    if (nextUser) {
      setUser(nextUser);
    }
    const result = await hydrateUser(nextUser ?? user);
    if (!result.ok) {
      clearAuthState();
    }
  }, [hydrateUser, user, clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      role: role ?? (session?.user ? 'viewer' : null),
      mfaEnabled,
      isLoading,
      isAuthenticated: Boolean(session?.user),
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
