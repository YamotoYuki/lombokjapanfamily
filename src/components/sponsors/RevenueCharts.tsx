import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import {
  SPONSOR_TYPE_LABEL,
  formatSponsorAmount,
  type SponsorStats,
  type SponsorType,
} from '@/types/sponsor';

const PIE_COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#10B981', '#9CA3AF'];

interface RevenueChartsProps {
  stats?: SponsorStats;
  isLoading?: boolean;
}

export default function RevenueCharts({ stats, isLoading }: RevenueChartsProps) {
  const monthly = stats?.monthly_series ?? [];
  const breakdown =
    stats?.type_breakdown.map((item) => ({
      ...item,
      name:
        SPONSOR_TYPE_LABEL[item.type as SponsorType] ?? String(item.type),
    })) ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <p className="mb-3 text-sm font-medium text-white">月別売上推移</p>
        <div className="h-64">
          {isLoading ? (
            <p className="text-sm text-muted">読み込み中...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number) => formatSponsorAmount(value)}
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-white">案件種別割合</p>
        <div className="h-64">
          {isLoading ? (
            <p className="text-sm text-muted">読み込み中...</p>
          ) : breakdown.length === 0 ? (
            <p className="text-sm text-muted">データなし</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {breakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
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

      <Card className="xl:col-span-3">
        <p className="mb-3 text-sm font-medium text-white">案件数推移</p>
        <div className="h-56">
          {isLoading ? (
            <p className="text-sm text-muted">読み込み中...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#DC2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
