import { Card } from '@/components/ui';
import type { UserStats } from '@/types/user';

interface UserStatsCardsProps {
  stats?: UserStats;
  isLoading?: boolean;
}

export default function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  const cards = [
    { label: '総ユーザー数', value: stats?.total },
    { label: 'Admin', value: stats?.admin_count },
    { label: 'Editor', value: stats?.editor_count },
    { label: 'Viewer', value: stats?.viewer_count },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || card.value === undefined ? '—' : card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
