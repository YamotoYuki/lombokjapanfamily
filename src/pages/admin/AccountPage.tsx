import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  KeyRound,
  LogOut,
  Shield,
  UserRound,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MfaStatusBadge } from '@/components/users';
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

const TABS: { id: AccountTab; label: string; icon: typeof UserRound }[] = [
  { id: 'profile', label: 'プロフィール', icon: UserRound },
  { id: 'password', label: 'パスワード変更', icon: KeyRound },
  { id: 'security', label: 'セキュリティ', icon: Shield },
];

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ja-JP');
}

function isAccountTab(value: string | null): value is AccountTab {
  return value === 'profile' || value === 'password' || value === 'security';
}

export default function AccountPage() {
  const { user, profile, role, mfaEnabled, signOut, refreshProfile } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: AccountTab = isAccountTab(tabParam) ? tabParam : 'profile';

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
          err instanceof Error ? err.message : 'アカウント情報の取得に失敗しました',
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [profile?.display_name]);

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
      setMessage(okMessage ?? 'プロフィール画像を更新しました');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'プロフィール画像のアップロードに失敗しました',
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
      setError('表示名を入力してください');
      return;
    }
    setSavingProfile(true);
    try {
      const { payload, message: okMessage } = await updateMyProfile({
        display_name: name,
      });
      setAccount(payload);
      await refreshProfile();
      setMessage(okMessage ?? 'プロフィールを更新しました');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'プロフィールの更新に失敗しました',
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
      setError('メールアドレスが取得できません');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('すべてのパスワード欄を入力してください');
      return;
    }
    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上にしてください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('確認用パスワードが一致しません');
      return;
    }

    setSavingPassword(true);
    try {
      const verify = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verify.error) {
        throw new Error('現在のパスワードが正しくありません');
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw new Error(updateError.message || 'パスワードの変更に失敗しました');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('パスワードを変更しました');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'パスワードの変更に失敗しました',
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
            アカウント設定
          </h2>
          <p className="mt-2 text-sm text-muted">
            プロフィール・パスワード・セキュリティを管理します。
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => void handleSignOut()}
        >
          <LogOut size={16} aria-hidden />
          ログアウト
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
        aria-label="アカウント設定タブ"
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
              {item.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : null}

      {tab === 'profile' ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-white">プロフィール画像</h3>
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
                  JPG / PNG / WEBP · 最大 5MB
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
                  {uploading ? 'アップロード中...' : '画像を変更'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-white">基本情報</h3>
            <Input
              label="表示名"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
            />
            <Input
              label="メールアドレス"
              value={account?.email || user?.email || ''}
              disabled
              readOnly
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">ロール</p>
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
                <p className="text-xs text-muted">作成日</p>
                <p className="mt-1 text-sm text-white">
                  {formatDateTime(account?.created_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:col-span-2">
                <p className="text-xs text-muted">最終ログイン</p>
                <p className="mt-1 text-sm text-white">
                  {formatDateTime(account?.last_login_at)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              disabled={savingProfile}
              className="w-full sm:w-auto"
              onClick={() => void handleSaveProfile()}
            >
              {savingProfile ? '保存中...' : '表示名を保存'}
            </Button>
          </Card>
        </div>
      ) : null}

      {tab === 'password' ? (
        <Card className="mx-auto max-w-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">パスワード変更</h3>
          <p className="text-sm text-muted">
            Supabase Auth でパスワードを更新します。
          </p>
          <Input
            label="現在のパスワード"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            label="新しいパスワード"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label="確認用パスワード"
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
            {savingPassword ? '変更中...' : 'パスワードを変更'}
          </Button>
        </Card>
      ) : null}

      {tab === 'security' ? (
        <Card className="mx-auto max-w-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">セキュリティ</h3>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">MFA（多要素認証）</p>
                <p className="mt-1 text-xs text-muted">表示のみ · 設定画面はありません</p>
              </div>
              <MfaStatusBadge enabled={mfaEnabled ?? account?.mfa_enabled} />
            </div>
            {mfaEnabled === true || account?.mfa_enabled === true ? (
              <p className="mt-4 text-sm text-success">✅ 有効</p>
            ) : mfaEnabled === false || account?.mfa_enabled === false ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-amber-200">⚠ 未設定</p>
                <p className="text-sm leading-relaxed text-muted">
                  Supabaseで有効化できます（Dashboard → Authentication → Users）。
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">状態を確認できませんでした。</p>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
