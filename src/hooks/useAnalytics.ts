import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnalyticsCountries,
  fetchAnalyticsDevices,
  fetchAnalyticsPages,
  fetchAnalyticsSources,
  fetchAnalyticsSummary,
  fetchAnalyticsTimeseries,
  syncAnalytics,
} from '@/services/analyticsApi';

export type AnalyticsRangeParams = {
  start_date: string;
  end_date: string;
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (params: AnalyticsRangeParams) =>
    [...analyticsKeys.all, 'summary', params] as const,
  timeseries: (params: AnalyticsRangeParams) =>
    [...analyticsKeys.all, 'timeseries', params] as const,
  pages: (params: AnalyticsRangeParams & { limit?: number }) =>
    [...analyticsKeys.all, 'pages', params] as const,
  countries: (params: AnalyticsRangeParams) =>
    [...analyticsKeys.all, 'countries', params] as const,
  devices: (params: AnalyticsRangeParams) =>
    [...analyticsKeys.all, 'devices', params] as const,
  sources: (params: AnalyticsRangeParams) =>
    [...analyticsKeys.all, 'sources', params] as const,
};

export function useAnalyticsSummary(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => fetchAnalyticsSummary(params),
  });
}

export function useAnalyticsTimeseries(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.timeseries(params),
    queryFn: () => fetchAnalyticsTimeseries(params),
  });
}

export function useAnalyticsPages(
  params: AnalyticsRangeParams & { limit?: number },
) {
  return useQuery({
    queryKey: analyticsKeys.pages(params),
    queryFn: () => fetchAnalyticsPages(params),
  });
}

export function useAnalyticsCountries(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.countries(params),
    queryFn: () => fetchAnalyticsCountries(params),
  });
}

export function useAnalyticsDevices(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.devices(params),
    queryFn: () => fetchAnalyticsDevices(params),
  });
}

export function useAnalyticsSources(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.sources(params),
    queryFn: () => fetchAnalyticsSources(params),
  });
}

export function useSyncAnalytics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<AnalyticsRangeParams> = {}) =>
      syncAnalytics(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

/** Convenience hook bundle for the analytics page */
export function useAnalyticsDashboard(params: AnalyticsRangeParams) {
  const summary = useAnalyticsSummary(params);
  const timeseries = useAnalyticsTimeseries(params);
  const pages = useAnalyticsPages({ ...params, limit: 10 });
  const countries = useAnalyticsCountries(params);
  const devices = useAnalyticsDevices(params);
  const sources = useAnalyticsSources(params);

  return {
    summary,
    timeseries,
    pages,
    countries,
    devices,
    sources,
    isLoading:
      summary.isLoading ||
      timeseries.isLoading ||
      pages.isLoading ||
      countries.isLoading ||
      devices.isLoading ||
      sources.isLoading,
    isError:
      summary.isError ||
      timeseries.isError ||
      pages.isError ||
      countries.isError ||
      devices.isError ||
      sources.isError,
    errorMessage:
      (summary.error instanceof Error && summary.error.message) ||
      (timeseries.error instanceof Error && timeseries.error.message) ||
      (pages.error instanceof Error && pages.error.message) ||
      (countries.error instanceof Error && countries.error.message) ||
      (devices.error instanceof Error && devices.error.message) ||
      (sources.error instanceof Error && sources.error.message) ||
      'アクセス解析データの取得に失敗しました',
  };
}
