import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  RoleSelector,
  UserForm,
  UserRoleBadge,
  UserStatusBadge,
} from '@/components/users';
import { Button, Card } from '@/components/ui';
import {
  useDeleteUser,
  useUpdateUserProfile,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUser,
} from '@/hooks/useUsers';
import {
  USER_STATUS_LABEL,
  type UserRole,
  type UserStatus,
} from '@/types/user';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userQuery = useUser(id);
  const updateProfile = useUpdateUserProfile();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (userQuery.isLoading) {
    return <p className="text-sm text-muted">ユーザー詳細を読み込んでいます...</p>;
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
        {userQuery.error instanceof Error
          ? userQuery.error.message
          : 'ユーザーの取得に失敗しました'}
      </div>
    );
  }

  const user = userQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            User Detail
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {user.display_name || user.email}
          </h2>
        </div>
        <Link
          to="/admin/users"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← 一覧へ戻る
        </Link>
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-start gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-sm text-muted">
                No Image
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xl font-semibold text-white">
                {user.display_name || '—'}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <UserRoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-white/5 py-2">
              <dt className="text-muted">作成日</dt>
              <dd className="text-white">{user.created_at?.slice(0, 10)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/5 py-2">
              <dt className="text-muted">最終ログイン</dt>
              <dd className="text-white">
                {user.last_login_at?.slice(0, 16).replace('T', ' ') || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted">更新日</dt>
              <dd className="text-white">{user.updated_at?.slice(0, 10)}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-white">権限変更</h3>
            <RoleSelector
              value={user.role}
              onChange={async (role: UserRole) => {
                setError(null);
                try {
                  const result = await updateRole.mutateAsync({
                    id: user.id,
                    role,
                  });
                  setMessage(result.message ?? 'ユーザーを更新しました');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ユーザー更新に失敗しました',
                  );
                }
              }}
            />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-white">状態変更</h3>
            <select
              value={user.status}
              onChange={async (event) => {
                setError(null);
                try {
                  const result = await updateStatus.mutateAsync({
                    id: user.id,
                    status: event.target.value as UserStatus,
                  });
                  setMessage(result.message ?? 'ユーザーを更新しました');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ユーザー更新に失敗しました',
                  );
                }
              }}
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {(Object.keys(USER_STATUS_LABEL) as UserStatus[]).map((key) => (
                <option key={key} value={key}>
                  {USER_STATUS_LABEL[key]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                setError(null);
                try {
                  await deleteMutation.mutateAsync(user.id);
                  setMessage('ユーザーを更新しました');
                  navigate('/admin/users');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ユーザー更新に失敗しました',
                  );
                }
              }}
            >
              論理削除
            </Button>
          </Card>
        </div>
      </div>

      <UserForm
        user={user}
        saving={updateProfile.isPending}
        onSubmit={async (input) => {
          setError(null);
          const result = await updateProfile.mutateAsync({
            id: user.id,
            input,
          });
          setMessage(result.message ?? 'ユーザーを更新しました');
        }}
      />
    </div>
  );
}
