import { useMemo, useState } from 'react';
import {
  AnalyticsDateFilter,
  AnalyticsStatsCards,
  AnalyticsSyncButton,
  CountryPieChart,
  DevicePieChart,
  PageViewLineChart,
  PopularPagesTable,
  SessionLineChart,
  SourceBarChart,
  TrafficSourcesTable,
  UserLineChart,
  resolveAnalyticsPreset,
} from '@/components/analytics';
import type { AnalyticsPreset } from '@/components/analytics/datePresets';
import {
  useAnalyticsDashboard,
  useSyncAnalytics,
} from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const initial = useMemo(() => resolveAnalyticsPreset('30d'), []);
  const [preset, setPreset] = useState<AnalyticsPreset>('30d');
  const [startDate, setStartDate] = useState(initial.start_date);
  const [endDate, setEndDate] = useState(initial.end_date);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(
    () => ({ start_date: startDate, end_date: endDate }),
    [startDate, endDate],
  );

  const dashboard = useAnalyticsDashboard(range);
  const syncMutation = useSyncAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Analytics
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">アクセス解析</h2>
          <p className="mt-2 text-sm text-muted">
            GA4データをキャッシュし、サイトの閲覧傾向を可視化します。
          </p>
        </div>
        <AnalyticsSyncButton
          loading={syncMutation.isPending}
          onSync={() => {
            setError(null);
            setMessage(null);
            void syncMutation
              .mutateAsync(range)
              .then((result) => {
                setMessage(result.message ?? 'Google Analyticsと同期しました');
              })
              .catch((err: unknown) => {
                setError(
                  err instanceof Error
                    ? err.message
                    : 'Google Analyticsとの同期に失敗しました',
                );
              });
          }}
        />
      </div>

      <AnalyticsDateFilter
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        onChange={(next) => {
          setPreset(next.preset);
          setStartDate(next.start_date);
          setEndDate(next.end_date);
        }}
      />

      {(message || error || dashboard.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || dashboard.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error || (dashboard.isError ? dashboard.errorMessage : message)}
        </div>
      )}

      <AnalyticsStatsCards
        summary={dashboard.summary.data}
        isLoading={dashboard.summary.isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <PageViewLineChart
          data={dashboard.timeseries.data ?? []}
          isLoading={dashboard.timeseries.isLoading}
        />
        <UserLineChart
          data={dashboard.timeseries.data ?? []}
          isLoading={dashboard.timeseries.isLoading}
        />
        <SessionLineChart
          data={dashboard.timeseries.data ?? []}
          isLoading={dashboard.timeseries.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CountryPieChart
          data={dashboard.countries.data ?? []}
          isLoading={dashboard.countries.isLoading}
        />
        <DevicePieChart
          data={dashboard.devices.data ?? []}
          isLoading={dashboard.devices.isLoading}
        />
        <SourceBarChart
          data={dashboard.sources.data ?? []}
          isLoading={dashboard.sources.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PopularPagesTable
          items={dashboard.pages.data ?? []}
          isLoading={dashboard.pages.isLoading}
        />
        <TrafficSourcesTable
          items={dashboard.sources.data ?? []}
          isLoading={dashboard.sources.isLoading}
        />
      </div>
    </div>
  );
}
