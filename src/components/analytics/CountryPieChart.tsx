import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui';
import type { AnalyticsCountry } from '@/types/analytics';

const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#22C55E', '#6B7280', '#FFFFFF'];

interface CountryPieChartProps {
  data: AnalyticsCountry[];
  isLoading?: boolean;
}

export default function CountryPieChart({
  data,
  isLoading,
}: CountryPieChartProps) {
  const chartData = data.slice(0, 6).map((item) => ({
    name: item.country,
    value: item.active_users,
  }));

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">国別アクセス</p>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted">データがありません</p>
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
