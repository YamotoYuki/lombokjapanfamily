import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { formatSponsorAmount, type SponsorStats } from '@/types/sponsor';

interface SponsorStatsCardsProps {
  stats?: SponsorStats;
  isLoading?: boolean;
}

export default function SponsorStatsCards({
  stats,
  isLoading,
}: SponsorStatsCardsProps) {
  const { t } = useTranslation();
  const cards = [
    {
      key: 'total',
      label: t('admin.sponsors.totalDeals'),
      getValue: (s: SponsorStats) => String(s.total),
    },
    {
      key: 'in_progress',
      label: t('admin.sponsors.inProgress'),
      getValue: (s: SponsorStats) => String(s.in_progress_count),
    },
    {
      key: 'monthly',
      label: t('admin.sponsors.monthlyRevenue'),
      getValue: (s: SponsorStats) => formatSponsorAmount(s.monthly_revenue),
    },
    {
      key: 'yearly',
      label: t('admin.sponsors.yearlyRevenue'),
      getValue: (s: SponsorStats) => formatSponsorAmount(s.yearly_revenue),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || !stats ? t('admin.common.dash') : card.getValue(stats)}
          </p>
          {stats && card.key === 'yearly' && (
            <p className="text-xs text-muted">
              {t('admin.sponsors.averageAmount', {
                amount: formatSponsorAmount(stats.average_amount),
              })}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
