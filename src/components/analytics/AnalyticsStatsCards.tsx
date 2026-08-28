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

const cards = [
  {
    key: 'pv',
    label: '総PV',
    getValue: (s: AnalyticsSummary) => formatNumber(s.total_pv),
  },
  {
    key: 'uu',
    label: '総UU',
    getValue: (s: AnalyticsSummary) => formatNumber(s.total_uu),
  },
  {
    key: 'sessions',
    label: 'セッション数',
    getValue: (s: AnalyticsSummary) => formatNumber(s.total_sessions),
  },
  {
    key: 'duration',
    label: '平均滞在時間',
    getValue: (s: AnalyticsSummary) => formatDuration(s.avg_session_duration),
  },
  {
    key: 'bounce',
    label: '直帰率',
    getValue: (s: AnalyticsSummary) => formatPercent(s.bounce_rate),
  },
  {
    key: 'events',
    label: 'イベント数',
    getValue: (s: AnalyticsSummary) => formatNumber(s.event_count),
  },
] as const;

export default function AnalyticsStatsCards({
  summary,
  isLoading,
}: AnalyticsStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {card.label}
          </p>
          <p className="text-2xl font-semibold text-white">
            {isLoading || !summary ? '—' : card.getValue(summary)}
          </p>
        </Card>
      ))}
    </div>
  );
}
