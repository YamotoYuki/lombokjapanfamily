import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import type { UserStats } from '@/types/user';

interface UserStatsCardsProps {
  stats?: UserStats;
  isLoading?: boolean;
}

export default function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  const { t } = useTranslation();
  const dash = t('admin.common.dash');
  const cards = [
    { key: 'total', label: t('admin.users.totalUsers'), value: stats?.total },
    {
      key: 'admin',
      label: t('admin.users.roles.admin'),
      value: stats?.admin_count,
    },
    {
      key: 'editor',
      label: t('admin.users.roles.editor'),
      value: stats?.editor_count,
    },
    {
      key: 'viewer',
      label: t('admin.users.roles.viewer'),
      value: stats?.viewer_count,
    },
    // Only when the backend reports it and there are any: role-less
    // accounts cannot use the CMS until an admin assigns a role.
    ...(stats?.unassigned_count
      ? [
          {
            key: 'unassigned',
            label: t('admin.users.roles.unassigned'),
            value: stats.unassigned_count,
          },
        ]
      : []),
  ];

  return (
    <div
      className={[
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3',
        cards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
      ].join(' ')}
    >
      {cards.map((card) => (
        <Card key={card.key} className="space-y-1 sm:space-y-2">
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-gold sm:text-xs sm:tracking-[0.18em]">
            {card.label}
          </p>
          <p className="text-lg font-semibold text-white sm:text-2xl">
            {isLoading || card.value === undefined ? dash : card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
