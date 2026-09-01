import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import UserRoleBadge from '@/components/users/UserRoleBadge';
import UserStatusBadge from '@/components/users/UserStatusBadge';
import type { User } from '@/types/user';

interface UsersTableProps {
  items: User[];
  isLoading?: boolean;
  total?: number;
  adminCount?: number;
  editorCount?: number;
  viewerCount?: number;
}

export default function UsersTable({
  items,
  isLoading,
  total,
  adminCount,
  editorCount,
  viewerCount,
}: UsersTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title={t('admin.dashboard.usersManage')}
        subtitle={
          typeof total === 'number'
            ? t('admin.dashboard.usersCount', {
                total,
                admin: adminCount ?? 0,
                editor: editorCount ?? 0,
                viewer: viewerCount ?? 0,
              })
            : t('admin.dashboard.usersSubtitle')
        }
        actionLabel={t('admin.common.viewAll')}
        actionTo="/admin/users"
      />
      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colUsername')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.common.email')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colRole')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colState')}
                </th>
                <th className="pb-3 font-medium">
                  {t('admin.dashboard.colLastLogin')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-3 pr-3 font-medium text-white">
                    {user.display_name || t('admin.common.dash')}
                  </td>
                  <td className="py-3 pr-3 text-muted">{user.email}</td>
                  <td className="py-3 pr-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="py-3 pr-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {user.last_login_at?.slice(0, 16).replace('T', ' ') ||
                      t('admin.common.dash')}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-muted">
                    {t('admin.dashboard.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
