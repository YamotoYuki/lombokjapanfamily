import { apiClient } from '@/services/apiClient';
import type {
  AnalyticsCountry,
  AnalyticsDevice,
  AnalyticsPage,
  AnalyticsSource,
  AnalyticsSummary,
  AnalyticsSyncResult,
  AnalyticsTimeSeries,
} from '@/types/analytics';

type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

type DateParams = {
  start_date?: string;
  end_date?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (maybeAxios.response?.data?.message) {
      return maybeAxios.response.data.message;
    }
    if (maybeAxios.message) {
      return maybeAxios.message;
    }
  }
  return fallback;
}

async function unwrap<T>(
  promise: Promise<{ data: ApiEnvelope<T> }>,
  fallback: string,
) {
  try {
    const { data } = await promise;
    if (!data.ok || data.data === undefined) {
      throw new Error(data.message ?? fallback);
    }
    return { payload: data.data, message: data.message };
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export async function fetchAnalyticsSummary(params: DateParams = {}) {
  const { payload } = await unwrap<AnalyticsSummary>(
    apiClient.get('/analytics/summary', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload;
}

export async function fetchAnalyticsTimeseries(params: DateParams = {}) {
  const { payload } = await unwrap<{ items: AnalyticsTimeSeries[] }>(
    apiClient.get('/analytics/timeseries', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchAnalyticsPages(
  params: DateParams & { limit?: number } = {},
) {
  const { payload } = await unwrap<{ items: AnalyticsPage[] }>(
    apiClient.get('/analytics/pages', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchAnalyticsCountries(params: DateParams = {}) {
  const { payload } = await unwrap<{ items: AnalyticsCountry[] }>(
    apiClient.get('/analytics/countries', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchAnalyticsDevices(params: DateParams = {}) {
  const { payload } = await unwrap<{ items: AnalyticsDevice[] }>(
    apiClient.get('/analytics/devices', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchAnalyticsSources(params: DateParams = {}) {
  const { payload } = await unwrap<{ items: AnalyticsSource[] }>(
    apiClient.get('/analytics/sources', { params }),
    'アクセス解析データの取得に失敗しました',
  );
  return payload.items;
}

export async function syncAnalytics(params: DateParams = {}) {
  return unwrap<AnalyticsSyncResult>(
    apiClient.post('/analytics/sync', params),
    'Google Analyticsとの同期に失敗しました',
  );
}
