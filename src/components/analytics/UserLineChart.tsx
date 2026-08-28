import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import type { AnalyticsTimeSeries } from '@/types/analytics';

interface UserLineChartProps {
  data: AnalyticsTimeSeries[];
  isLoading?: boolean;
}

export default function UserLineChart({ data, isLoading }: UserLineChartProps) {
  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">日別UU推移</p>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted">データがありません</p>
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
                dataKey="uu"
                stroke="#F59E0B"
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
