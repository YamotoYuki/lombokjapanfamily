export type AnalyticsPreset =
  | '7d'
  | '30d'
  | '90d'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function resolveAnalyticsPreset(
  preset: AnalyticsPreset,
  customStart?: string,
  customEnd?: string,
) {
  const today = new Date();
  const end = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  if (preset === 'custom') {
    return {
      start_date: customStart || toIso(new Date(end.getTime() - 29 * 86400000)),
      end_date: customEnd || toIso(end),
      preset,
    };
  }

  if (preset === 'this_month') {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    return { start_date: toIso(start), end_date: toIso(end), preset };
  }

  if (preset === 'last_month') {
    const start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1),
    );
    const lastEnd = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0),
    );
    return { start_date: toIso(start), end_date: toIso(lastEnd), preset };
  }

  if (preset === 'this_year') {
    const start = new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
    return { start_date: toIso(start), end_date: toIso(end), preset };
  }

  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { start_date: toIso(start), end_date: toIso(end), preset };
}
