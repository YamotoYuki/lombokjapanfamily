import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const dash = t('admin.common.dash');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
        <Input
          label={t('admin.common.keyword')}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t('admin.users.keywordPlaceholder')}
        />
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="user-role-filter">
            {t('admin.common.role')}
          </label>
          <select
            id="user-role-filter"
            value={role}
            onChange={(event) =>
              onRoleChange(event.target.value as UserRole | '')
            }
            className="touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 text-sm text-white outline-none"
          >
            <option value="">{t('admin.common.all')}</option>
            {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((key) => (
              <option key={key} value={key}>
                {t(`admin.users.roles.${key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="user-status-filter">
            {t('admin.common.status')}
          </label>
          <select
            id="user-status-filter"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as UserStatus | '')
            }
            className="touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 text-sm text-white outline-none"
          >
            <option value="">{t('admin.common.all')}</option>
            {(Object.keys(USER_STATUS_LABEL) as UserStatus[]).map((key) => (
              <option key={key} value={key}>
                {t(`admin.users.statuses.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
          {t('admin.users.empty')}
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
                    {user.display_name || dash}
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
                {t('admin.users.lastLoginLabel', {
                  date:
                    user.last_login_at?.slice(0, 16).replace('T', ' ') || dash,
                })}
              </p>
              <div className="mt-4 flex gap-2">
                <LinkButton
                  to={`/admin/users/${user.id}/edit`}
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                >
                  {t('admin.common.detail')}
                </LinkButton>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  disabled={busyId === user.id}
                  onClick={() => onDelete(user)}
                >
                  {t('admin.common.delete')}
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
                <th className="px-4 py-3">{t('admin.common.name')}</th>
                <th className="px-4 py-3">{t('admin.common.email')}</th>
                <th className="px-4 py-3">{t('admin.common.role')}</th>
                <th className="px-4 py-3">{t('admin.common.status')}</th>
                <th className="px-4 py-3">{t('admin.users.mfa')}</th>
                <th className="px-4 py-3">{t('admin.users.lastLogin')}</th>
                <th className="px-4 py-3">{t('admin.common.createdAt')}</th>
                <th className="px-4 py-3">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">
                    {user.display_name || dash}
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
                    {user.last_login_at?.slice(0, 16).replace('T', ' ') || dash}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.created_at?.slice(0, 10) || dash}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <LinkButton
                        to={`/admin/users/${user.id}/edit`}
                        size="sm"
                        variant="ghost"
                      >
                        {t('admin.common.detail')}
                      </LinkButton>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === user.id}
                        onClick={() => onDelete(user)}
                      >
                        {t('admin.common.delete')}
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
