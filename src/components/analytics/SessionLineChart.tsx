import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import type { AnalyticsTimeSeries } from '@/types/analytics';

interface SessionLineChartProps {
  data: AnalyticsTimeSeries[];
  isLoading?: boolean;
}

export default function SessionLineChart({
  data,
  isLoading,
}: SessionLineChartProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">
        {t('admin.analytics.sessionTrend')}
      </p>
      <div className="h-48 sm:h-56 md:h-64">
        {isLoading ? (
          <p className="text-sm text-muted">{t('admin.common.loading')}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.common.empty')}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: isMobile ? -12 : 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: isMobile ? 9 : 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: isMobile ? 9 : 11 }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 28 : 40}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
