import UserRoleBadge from '@/components/users/UserRoleBadge';
import UserStatusBadge from '@/components/users/UserStatusBadge';
import MfaStatusBadge from '@/components/users/MfaStatusBadge';
import { Button, Input, LinkButton } from '@/components/ui';
import {
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
  type User,
  type UserRole,
  type UserStatus,
} from '@/types/user';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface UsersTableProps {
  items: User[];
  keyword: string;
  role: UserRole | '';
  status: UserStatus | '';
  busyId?: string | null;
  viewMode?: ViewMode;
  onKeywordChange: (value: string) => void;
  onRoleChange: (value: UserRole | '') => void;
  onStatusChange: (value: UserStatus | '') => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({
  items,
  keyword,
  role,
  status,
  busyId,
  viewMode = 'table',
  onKeywordChange,
  onRoleChange,
  onStatusChange,
  onDelete,
}: UsersTableProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
        <Input
          label="キーワード"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="名前・メール"
        />
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="user-role-filter">
            権限
          </label>
          <select
            id="user-role-filter"
            value={role}
            onChange={(event) =>
              onRoleChange(event.target.value as UserRole | '')
            }
            className="touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 text-sm text-white outline-none"
          >
            <option value="">すべて</option>
            {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((key) => (
              <option key={key} value={key}>
                {USER_ROLE_LABEL[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="user-status-filter">
            状態
          </label>
          <select
            id="user-status-filter"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as UserStatus | '')
            }
            className="touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 text-sm text-white outline-none"
          >
            <option value="">すべて</option>
            {(Object.keys(USER_STATUS_LABEL) as UserStatus[]).map((key) => (
              <option key={key} value={key}>
                {USER_STATUS_LABEL[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
          ユーザーはいません。
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-3">
          {items.map((user) => (
            <article
              key={user.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {user.display_name || '—'}
                  </h3>
                  <p className="mt-1 break-all text-xs text-muted">
                    {user.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UserRoleBadge role={user.role} />
                  <UserStatusBadge status={user.status} />
                  <MfaStatusBadge enabled={user.mfa_enabled} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                最終ログイン{' '}
                {user.last_login_at?.slice(0, 16).replace('T', ' ') || '—'}
              </p>
              <div className="mt-4 flex gap-2">
                <LinkButton
                  to={`/admin/users/${user.id}/edit`}
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                >
                  詳細
                </LinkButton>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  disabled={busyId === user.id}
                  onClick={() => onDelete(user)}
                >
                  削除
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">メール</th>
                <th className="px-4 py-3">権限</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">MFA</th>
                <th className="px-4 py-3">最終ログイン</th>
                <th className="px-4 py-3">作成日</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">
                    {user.display_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    <MfaStatusBadge enabled={user.mfa_enabled} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.last_login_at?.slice(0, 16).replace('T', ' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.created_at?.slice(0, 10) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <LinkButton
                        to={`/admin/users/${user.id}/edit`}
                        size="sm"
                        variant="ghost"
                      >
                        詳細
                      </LinkButton>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === user.id}
                        onClick={() => onDelete(user)}
                      >
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
