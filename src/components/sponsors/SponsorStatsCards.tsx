import { Card } from '@/components/ui';
import {
  formatSponsorAmount,
  type SponsorStats,
} from '@/types/sponsor';

interface SponsorStatsCardsProps {
  stats?: SponsorStats;
  isLoading?: boolean;
}

const cards = [
  { key: 'total', label: '総案件数', getValue: (s: SponsorStats) => String(s.total) },
  {
    key: 'in_progress',
    label: '進行中案件',
    getValue: (s: SponsorStats) => String(s.in_progress_count),
  },
  {
    key: 'monthly',
    label: '今月売上',
    getValue: (s: SponsorStats) => formatSponsorAmount(s.monthly_revenue),
  },
  {
    key: 'yearly',
    label: '年間売上',
    getValue: (s: SponsorStats) => formatSponsorAmount(s.yearly_revenue),
  },
] as const;

export default function SponsorStatsCards({
  stats,
  isLoading,
}: SponsorStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || !stats ? '—' : card.getValue(stats)}
          </p>
          {stats && card.key === 'yearly' && (
            <p className="text-xs text-muted">
              平均単価 {formatSponsorAmount(stats.average_amount)}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
