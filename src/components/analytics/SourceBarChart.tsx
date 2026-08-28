import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import type { AnalyticsSource } from '@/types/analytics';

interface SourceBarChartProps {
  data: AnalyticsSource[];
  isLoading?: boolean;
}

export default function SourceBarChart({
  data,
  isLoading,
}: SourceBarChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    name: `${item.source || '(direct)'} / ${item.medium || '(none)'}`,
    sessions: item.sessions,
  }));

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-white">流入元（セッション）</p>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
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
