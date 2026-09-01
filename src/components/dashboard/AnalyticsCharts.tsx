import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import { formatNumber } from '@/types/analytics';

const PIE_COLORS = ['#DC2626', '#F59E0B', '#374151', '#9CA3AF'];

export type DashboardAnalyticsPoint = {
  label: string;
  pv: number;
  uu: number;
};

export type DashboardPopularPage = {
  path: string;
  views: number;
};

export type DashboardCountry = {
  country: string;
  value: number;
};

interface AnalyticsChartsProps {
  series: DashboardAnalyticsPoint[];
  popularPages: DashboardPopularPage[];
  countries: DashboardCountry[];
  monthlyPv?: number;
  monthlyUu?: number;
  isLoading?: boolean;
}

export default function AnalyticsCharts({
  series,
  popularPages,
  countries,
  monthlyPv,
  monthlyUu,
  isLoading,
}: AnalyticsChartsProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.analytics')}
        subtitle={
          typeof monthlyPv === 'number'
            ? t('admin.dashboard.analyticsSubtitle', {
                pv: formatNumber(monthlyPv),
                uu: formatNumber(monthlyUu ?? 0),
              })
            : t('admin.dashboard.analyticsDefault')
        }
        actionLabel={t('admin.common.detail')}
        actionTo="/admin/analytics"
      />

      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-primary-bg/35 p-3">
            <p className="mb-2 text-xs text-muted">
              {t('admin.dashboard.trafficTrend')}
            </p>
            <div className="h-52">
              {series.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted">
                  {t('admin.common.empty')}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="uuFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
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
                    <Area
                      type="monotone"
                      dataKey="pv"
                      stroke="#DC2626"
                      fill="url(#pvFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="uu"
                      stroke="#F59E0B"
                      fill="url(#uuFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-primary-bg/35 p-3">
              <p className="mb-2 text-xs text-muted">
                {t('admin.dashboard.popularPages')}
              </p>
              <ul className="space-y-2">
                {popularPages.slice(0, 3).map((page) => (
                  <li
                    key={page.path}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-white">{page.path}</span>
                    <span className="text-gold">{formatNumber(page.views)}</span>
                  </li>
                ))}
                {popularPages.length === 0 && (
                  <li className="text-sm text-muted">{t('admin.common.empty')}</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/5 bg-primary-bg/35 p-3">
              <p className="mb-2 text-xs text-muted">
                {t('admin.dashboard.countries')}
              </p>
              <div className="flex items-center gap-3">
                <div className="h-28 w-28">
                  {countries.length === 0 ? (
                    <p className="text-xs text-muted">{t('admin.common.dash')}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countries.slice(0, 3)}
                          dataKey="value"
                          nameKey="country"
                          innerRadius={22}
                          outerRadius={40}
                        >
                          {countries.slice(0, 3).map((entry, index) => (
                            <Cell
                              key={entry.country}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <ul className="min-w-0 flex-1 space-y-1 text-xs">
                  {countries.slice(0, 3).map((item, index) => (
                    <li
                      key={item.country}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-muted">
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full"
                          style={{
                            background: PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        {item.country}
                      </span>
                      <span className="text-white">
                        {formatNumber(item.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
