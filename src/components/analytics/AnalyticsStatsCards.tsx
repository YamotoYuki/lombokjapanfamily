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

  const showNotSynced = !isLoading && Boolean(summary?.empty);

  return (
    <div className="space-y-3">
      {showNotSynced ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100">
          {t('admin.analytics.notSynced')}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.key} className="space-y-1 sm:space-y-2">
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-gold sm:text-xs sm:tracking-[0.18em]">
              {card.label}
            </p>
            <p className="text-lg font-semibold text-white sm:text-2xl">
              {isLoading || !summary
                ? t('admin.common.dash')
                : card.getValue(summary)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
