import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import type { AnalyticsSource } from '@/types/analytics';

interface SourceBarChartProps {
  data: AnalyticsSource[];
  isLoading?: boolean;
}

export default function SourceBarChart({
  data,
  isLoading,
}: SourceBarChartProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const chartData = data.slice(0, 8).map((item) => ({
    name: `${item.source || '(direct)'} / ${item.medium || '(none)'}`,
    sessions: item.sessions,
  }));

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">
        {t('admin.analytics.sourcesSessions')}
      </p>
      <div className="h-48 sm:h-56 md:h-64">
        {isLoading ? (
          <p className="text-sm text-muted">{t('admin.common.loading')}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.common.empty')}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: isMobile ? 4 : 24 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#9CA3AF', fontSize: isMobile ? 9 : 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 76 : 120}
                tick={{ fill: '#9CA3AF', fontSize: isMobile ? 8 : 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Bar dataKey="sessions" fill="#22C55E" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
