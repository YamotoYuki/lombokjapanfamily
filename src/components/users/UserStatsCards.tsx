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
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || card.value === undefined ? dash : card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
