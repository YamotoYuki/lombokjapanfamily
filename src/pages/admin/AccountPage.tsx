import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  KeyRound,
  LogOut,
  Shield,
  UserRound,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MfaStatusBadge } from '@/components/users';
import { AdminLanguageSettings } from '@/components/admin';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import {
  fetchCurrentUser,
  updateMyProfile,
  uploadMyAvatar,
} from '@/services/userApi';
import { USER_ROLE_LABEL, type User } from '@/types/user';

type AccountTab = 'profile' | 'password' | 'security';

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale);
}

function isAccountTab(value: string | null): value is AccountTab {
  return value === 'profile' || value === 'password' || value === 'security';
}

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const { user, profile, role, mfaEnabled, signOut, refreshProfile } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: AccountTab = isAccountTab(tabParam) ? tabParam : 'profile';
  const locale = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);

  const TABS: { id: AccountTab; labelKey: string; icon: typeof UserRound }[] = [
    { id: 'profile', labelKey: 'admin.account.tabs.profile', icon: UserRound },
    { id: 'password', labelKey: 'admin.account.tabs.password', icon: KeyRound },
    { id: 'security', labelKey: 'admin.account.tabs.security', icon: Shield },
  ];

  const [account, setAccount] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const setTab = (next: AccountTab) => {
    setMessage(null);
    setError(null);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'profile') params.delete('tab');
        else params.set('tab', next);
        return params;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const me = await fetchCurrentUser();
        if (!mounted) return;
        setAccount(me);
        setDisplayName(me.display_name || profile?.display_name || '');
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : t('admin.account.fetchFailed'),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [profile?.display_name, t]);

  const avatarUrl = account?.avatar_url || profile?.avatar_url || '';
  const initials = useMemo(() => {
    const source =
      displayName.trim() ||
      account?.display_name ||
      user?.email ||
      'AD';
    return source.slice(0, 2).toUpperCase();
  }, [displayName, account?.display_name, user?.email]);

  const handleAvatarChange = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const { payload, message: okMessage } = await uploadMyAvatar(file);
      setAccount(payload);
      await refreshProfile();
      setMessage(okMessage ?? t('admin.account.avatarUpdated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.account.avatarFailed'),
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setError(null);
    setMessage(null);
    const name = displayName.trim();
    if (!name) {
      setError(t('admin.account.displayNameRequired'));
      return;
    }
    setSavingProfile(true);
    try {
      const { payload, message: okMessage } = await updateMyProfile({
        display_name: name,
      });
      setAccount(payload);
      await refreshProfile();
      setMessage(okMessage ?? t('admin.account.profileUpdated'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.account.profileFailed'),
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setMessage(null);
    const email = user?.email?.trim();
    if (!email) {
      setError(t('admin.account.emailMissing'));
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('admin.account.passwordFieldsRequired'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('admin.account.passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('admin.account.passwordMismatch'));
      return;
    }

    setSavingPassword(true);
    try {
      const verify = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verify.error) {
        throw new Error(t('admin.account.passwordWrong'));
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw new Error(updateError.message || t('admin.account.passwordFailed'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(t('admin.account.passwordChanged'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.account.passwordFailed'),
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Account
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.account.title')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.account.description')}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => void handleSignOut()}
        >
          <LogOut size={16} aria-hidden />
          {t('admin.logout')}
        </Button>
      </div>

      {(message || error) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ?? message}
        </div>
      )}

      <div
        className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1"
        role="tablist"
        aria-label={t('admin.account.tabsAria')}
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={[
                'touch-target inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors sm:text-sm',
                active
                  ? 'bg-youtube-red/20 text-white'
                  : 'text-muted hover:text-white',
              ].join(' ')}
            >
              <Icon size={14} aria-hidden />
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('admin.account.loading')}</p>
      ) : null}

      {tab === 'profile' ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t('admin.account.avatar')}
            </h3>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-white/15"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-youtube-red to-amber-600 text-2xl font-semibold text-white ring-2 ring-white/15">
                    {initials}
                  </div>
                )}
              </div>
              <div className="w-full space-y-2 text-center sm:text-left">
                <p className="text-xs text-muted">
                  {t('admin.account.avatarHint')}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    void handleAvatarChange(event.target.files?.[0])
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploading}
                  className="w-full sm:w-auto"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={16} aria-hidden />
                  {uploading
                    ? t('admin.account.uploading')
                    : t('admin.account.changeImage')}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t('admin.account.basicInfo')}
            </h3>
            <Input
              label={t('admin.account.displayName')}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
            />
            <Input
              label={t('admin.account.email')}
              value={account?.email || user?.email || ''}
              disabled
              readOnly
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">{t('admin.account.role')}</p>
                <p className="mt-1 text-sm font-medium text-gold">
                  {USER_ROLE_LABEL[
                    (account?.role || role || 'viewer') as keyof typeof USER_ROLE_LABEL
                  ] ??
                    account?.role ??
                    role ??
                    '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">{t('admin.account.createdAt')}</p>
                <p className="mt-1 text-sm text-white">
                  {formatDateTime(account?.created_at, locale)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:col-span-2">
                <p className="text-xs text-muted">{t('admin.account.lastLogin')}</p>
                <p className="mt-1 text-sm text-white">
                  {formatDateTime(account?.last_login_at, locale)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              disabled={savingProfile}
              className="w-full sm:w-auto"
              onClick={() => void handleSaveProfile()}
            >
              {savingProfile
                ? t('admin.account.saving')
                : t('admin.account.saveDisplayName')}
            </Button>
          </Card>
          <div className="lg:col-span-2">
            <AdminLanguageSettings />
          </div>
        </div>
      ) : null}

      {tab === 'password' ? (
        <Card className="mx-auto max-w-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {t('admin.account.passwordTitle')}
          </h3>
          <p className="text-sm text-muted">
            {t('admin.account.passwordDescription')}
          </p>
          <Input
            label={t('admin.account.currentPassword')}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            label={t('admin.account.newPassword')}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label={t('admin.account.confirmPassword')}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button
            type="button"
            disabled={savingPassword}
            className="w-full sm:w-auto"
            onClick={() => void handleChangePassword()}
          >
            {savingPassword
              ? t('admin.account.changing')
              : t('admin.account.changePassword')}
          </Button>
        </Card>
      ) : null}

      {tab === 'security' ? (
        <Card className="mx-auto max-w-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {t('admin.account.securityTitle')}
          </h3>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {t('admin.account.mfaTitle')}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t('admin.account.mfaDescription')}
                </p>
              </div>
              <MfaStatusBadge enabled={mfaEnabled ?? account?.mfa_enabled} />
            </div>
            {mfaEnabled === true || account?.mfa_enabled === true ? (
              <p className="mt-4 text-sm text-success">
                {t('admin.account.mfaEnabled')}
              </p>
            ) : mfaEnabled === false || account?.mfa_enabled === false ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-amber-200">
                  {t('admin.account.mfaDisabled')}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">—</p>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
