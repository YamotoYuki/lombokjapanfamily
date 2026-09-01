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
import type { AnalyticsTimeSeries } from '@/types/analytics';

interface PageViewLineChartProps {
  data: AnalyticsTimeSeries[];
  isLoading?: boolean;
}

export default function PageViewLineChart({
  data,
  isLoading,
}: PageViewLineChartProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">
        {t('admin.analytics.dailyPv')}
      </p>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">{t('admin.common.loading')}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.common.empty')}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
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
                dataKey="pv"
                stroke="#DC2626"
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
