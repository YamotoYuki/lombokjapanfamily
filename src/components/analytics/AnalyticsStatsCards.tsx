import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import {
  formatDuration,
  formatNumber,
  formatPercent,
  type AnalyticsSummary,
} from '@/types/analytics';

interface AnalyticsStatsCardsProps {
  summary?: AnalyticsSummary;
  isLoading?: boolean;
}

export default function AnalyticsStatsCards({
  summary,
  isLoading,
}: AnalyticsStatsCardsProps) {
  const { t } = useTranslation();
  const cards = [
    {
      key: 'pv',
      label: t('admin.analytics.totalPv'),
      getValue: (s: AnalyticsSummary) => formatNumber(s.total_pv),
    },
    {
      key: 'uu',
      label: t('admin.analytics.totalUu'),
      getValue: (s: AnalyticsSummary) => formatNumber(s.total_uu),
    },
    {
      key: 'sessions',
      label: t('admin.analytics.sessions'),
      getValue: (s: AnalyticsSummary) => formatNumber(s.total_sessions),
    },
    {
      key: 'duration',
      label: t('admin.analytics.avgDuration'),
      getValue: (s: AnalyticsSummary) => formatDuration(s.avg_session_duration),
    },
    {
      key: 'bounce',
      label: t('admin.analytics.bounceRate'),
      getValue: (s: AnalyticsSummary) => formatPercent(s.bounce_rate),
    },
    {
      key: 'events',
      label: t('admin.analytics.events'),
      getValue: (s: AnalyticsSummary) => formatNumber(s.event_count),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || !summary
              ? t('admin.common.dash')
              : card.getValue(summary)}
          </p>
        </Card>
      ))}
    </div>
  );
}
