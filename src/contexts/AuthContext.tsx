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
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[auth] failed to load role', error.message);
    return null;
  }

  const row = data as { role: AppRole } | null;
  return row?.role ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      setRole(null);
      return;
    }

    const [nextProfile, nextRole] = await Promise.all([
      fetchProfile(nextUser.id),
      fetchRole(nextUser.id),
    ]);

    setProfile(nextProfile);
    setRole(nextRole);
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
      await hydrateUser(data.session?.user ?? null);
      if (mounted) setIsLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void (async () => {
        await hydrateUser(nextSession?.user ?? null);
        setIsLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Soft update last login via profiles (best-effort)
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
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  }, []);

  const hasRole = useCallback(
    (...roles: AppRole[]) => {
      if (!role) return false;
      return roles.includes(role);
    },
    [role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      role,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      signIn,
      signOut,
      hasRole,
    }),
    [user, session, profile, role, isLoading, signIn, signOut, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
