import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserStatsCards, UsersTable } from '@/components/users';
import { ConfirmDialog, ViewModeToggle } from '@/components/ui';
import { useDeleteUser, useUsers } from '@/hooks/useUsers';
import { useUserStats } from '@/hooks/useUserStats';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { User, UserRole, UserStatus } from '@/types/user';

export default function UsersPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      role: role || undefined,
      status: status || undefined,
      page: 1,
      limit: 100,
    }),
    [keyword, role, status],
  );

  const usersQuery = useUsers(params);
  const statsQuery = useUserStats();
  const deleteMutation = useDeleteUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            {t('admin.titles.users')}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.pages.users.manageTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.users.description')}
          </p>
        </div>
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          allowTable={allowTable}
        />
      </div>

      <UserStatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      {(message || error || usersQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || usersQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ||
            (usersQuery.isError
              ? usersQuery.error instanceof Error
                ? usersQuery.error.message
                : t('admin.pages.users.fetchFailed')
              : message)}
        </div>
      )}

      {usersQuery.isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <UsersTable
          items={usersQuery.data?.items ?? []}
          keyword={keyword}
          role={role}
          status={status}
          busyId={busyId}
          viewMode={viewMode}
          onKeywordChange={setKeyword}
          onRoleChange={setRole}
          onStatusChange={setStatus}
          onDelete={(user) => setPendingDelete(user)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        detail={
          pendingDelete?.display_name ||
          pendingDelete?.email ||
          undefined
        }
        confirming={Boolean(pendingDelete && busyId === pendingDelete.id)}
        onCancel={() => {
          if (!busyId) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete || busyId) return;
          void (async () => {
            setBusyId(pendingDelete.id);
            setError(null);
            setMessage(null);
            try {
              const result = await deleteMutation.mutateAsync(pendingDelete.id);
              setMessage(result.message ?? t('admin.pages.users.updated'));
              setPendingDelete(null);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.users.updateFailed'),
              );
            } finally {
              setBusyId(null);
            }
          })();
        }}
      />
    </div>
  );
}
