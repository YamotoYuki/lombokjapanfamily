import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui';
import type { AnalyticsDevice } from '@/types/analytics';

const COLORS = ['#DC2626', '#F59E0B', '#3B82F6'];

interface DevicePieChartProps {
  data: AnalyticsDevice[];
  isLoading?: boolean;
}

export default function DevicePieChart({
  data,
  isLoading,
}: DevicePieChartProps) {
  const { t } = useTranslation();
  const labelKey: Record<string, string> = {
    desktop: 'admin.analytics.desktop',
    mobile: 'admin.analytics.mobile',
    tablet: 'admin.analytics.tablet',
  };
  const chartData = data.map((item) => ({
    name: labelKey[item.device_category]
      ? t(labelKey[item.device_category])
      : item.device_category,
    value: item.active_users,
  }));

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">
        {t('admin.analytics.byDevice')}
      </p>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">{t('admin.common.loading')}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.common.empty')}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
