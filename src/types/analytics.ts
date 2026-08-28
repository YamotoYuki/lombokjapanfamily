export type AnalyticsSummary = {
  total_pv: number;
  total_uu: number;
  total_sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  event_count: number;
  start_date?: string;
  end_date?: string;
  empty?: boolean;
};

export type AnalyticsTimeSeries = {
  date: string;
  pv: number;
  uu: number;
  sessions: number;
};

export type AnalyticsPage = {
  page_path: string;
  page_title?: string;
  pv: number;
  active_users: number;
};

export type AnalyticsCountry = {
  country: string;
  active_users: number;
  sessions: number;
};

export type AnalyticsDevice = {
  device_category: string;
  active_users: number;
  sessions: number;
};

export type AnalyticsSource = {
  source?: string;
  medium?: string;
  sessions: number;
  active_users: number;
};

export type AnalyticsDateRange = {
  start_date: string;
  end_date: string;
  preset?: string;
};

export type AnalyticsSyncResult = {
  start_date: string;
  end_date: string;
  cache_rows: number;
  pages_rows: number;
  countries_rows: number;
  devices_rows: number;
  sources_rows: number;
};

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}分${s.toString().padStart(2, '0')}秒`;
}

export function formatPercent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value || 0);
}
