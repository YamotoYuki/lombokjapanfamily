import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import {
  MfaStatusBadge,
  RoleSelector,
  UserForm,
  UserRoleBadge,
  UserStatusBadge,
} from '@/components/users';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import {
  useDeleteUser,
  useUpdateUserProfile,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUser,
} from '@/hooks/useUsers';
import { type UserRole, type UserStatus } from '@/types/user';

const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const userQuery = useUser(id);
  const updateProfile = useUpdateUserProfile();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (userQuery.isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        {t('admin.pages.users.loading')}
      </p>
    );
  }

  if (userQuery.isError || !userQuery.data || (id && userQuery.data.id !== id)) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.users.resource')}
        backTo="/admin/users"
        detail={
          userQuery.error instanceof Error
            ? userQuery.error.message
            : undefined
        }
      />
    );
  }

  const user = userQuery.data;

  return (
    <AdminEditChrome
      eyebrow={t('admin.pages.users.editEyebrow')}
      title={user.display_name || user.email}
      subtitle={user.email}
      backTo="/admin/users"
      message={message}
      error={error}
    >
      <div className="space-y-6">
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
                  {t('admin.common.imageUnset')}
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">
                  {user.display_name || t('admin.common.dash')}
                </p>
                <p className="text-sm text-muted">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                  <UserRoleBadge role={user.role} />
                  <UserStatusBadge status={user.status} />
                  <MfaStatusBadge enabled={user.mfa_enabled} />
                </div>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-white/5 py-2">
                <dt className="text-muted">{t('admin.account.mfaTitle')}</dt>
                <dd className="text-right text-white">
                  {user.mfa_enabled === true
                    ? t('admin.pages.users.mfaVerified')
                    : user.mfa_enabled === false
                      ? t('admin.pages.users.mfaRecommend')
                      : t('admin.pages.users.mfaUnknown')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/5 py-2">
                <dt className="text-muted">{t('admin.account.createdAt')}</dt>
                <dd className="text-white">{user.created_at?.slice(0, 10)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/5 py-2">
                <dt className="text-muted">{t('admin.account.lastLogin')}</dt>
                <dd className="text-white">
                  {user.last_login_at?.slice(0, 16).replace('T', ' ') ||
                    t('admin.common.dash')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('admin.common.updatedAt')}</dt>
                <dd className="text-white">{user.updated_at?.slice(0, 10)}</dd>
              </div>
            </dl>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                {t('admin.pages.users.roleChange')}
              </h3>
              <RoleSelector
                value={user.role}
                onChange={async (role: UserRole) => {
                  setError(null);
                  try {
                    const result = await updateRole.mutateAsync({
                      id: user.id,
                      role,
                    });
                    setMessage(
                      result.message ?? t('admin.pages.users.updated'),
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : t('admin.pages.users.updateFailed'),
                    );
                  }
                }}
              />
            </Card>

            <Card className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                {t('admin.pages.users.statusChange')}
              </h3>
              <select
                value={user.status}
                onChange={async (event) => {
                  setError(null);
                  try {
                    const result = await updateStatus.mutateAsync({
                      id: user.id,
                      status: event.target.value as UserStatus,
                    });
                    setMessage(
                      result.message ?? t('admin.pages.users.updated'),
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : t('admin.pages.users.updateFailed'),
                    );
                  }
                }}
                className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
              >
                {USER_STATUSES.map((key) => (
                  <option key={key} value={key}>
                    {t(`admin.users.statuses.${key}`)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
              >
                {t('admin.pages.users.softDelete')}
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
            setMessage(result.message ?? t('admin.pages.users.updated'));
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        detail={user.display_name || user.email}
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setConfirmDelete(false);
        }}
        onConfirm={() => {
          if (deleteMutation.isPending) return;
          setError(null);
          void deleteMutation
            .mutateAsync(user.id)
            .then(() => {
              navigate('/admin/users', {
                replace: true,
                state: { message: t('admin.pages.users.updated') },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.users.updateFailed'),
              );
            });
        }}
      />
    </AdminEditChrome>
  );
}
