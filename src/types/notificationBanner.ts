import {
  fromDatetimeLocalValue,
  normalizeContentLang,
  toDatetimeLocalValue,
  type AppContentLang,
} from '@/types/announcement';

export type NotificationBanner = {
  id: string;
  title_ja: string;
  title_en?: string | null;
  title_id?: string | null;
  message_ja: string;
  message_en?: string | null;
  message_id?: string | null;
  link_url?: string | null;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationBannerInput = {
  title_ja: string;
  title_en?: string | null;
  title_id?: string | null;
  message_ja?: string | null;
  message_en?: string | null;
  message_id?: string | null;
  link_url?: string | null;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
  is_active?: boolean;
};

function pickLocalized(
  primary: string | null | undefined,
  fallbackJa: string | null | undefined,
): string {
  const first = primary?.trim();
  if (first) return first;
  return fallbackJa?.trim() || '';
}

export function localizedBannerTitle(
  item: Pick<NotificationBanner, 'title_ja' | 'title_en' | 'title_id'>,
  lang?: string | null,
): string {
  const code = normalizeContentLang(lang);
  if (code === 'en') return pickLocalized(item.title_en, item.title_ja);
  if (code === 'id') return pickLocalized(item.title_id, item.title_ja);
  return (item.title_ja || '').trim();
}

export function localizedBannerMessage(
  item: Pick<NotificationBanner, 'message_ja' | 'message_en' | 'message_id'>,
  lang?: string | null,
): string {
  const code = normalizeContentLang(lang);
  if (code === 'en') return pickLocalized(item.message_en, item.message_ja);
  if (code === 'id') return pickLocalized(item.message_id, item.message_ja);
  return (item.message_ja || '').trim();
}

export function adminBannerTitle(
  item: Pick<NotificationBanner, 'title_ja'>,
) {
  return (item.title_ja || '').trim();
}

export type { AppContentLang };
export { fromDatetimeLocalValue, toDatetimeLocalValue };
