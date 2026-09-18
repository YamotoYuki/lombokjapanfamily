export const ANNOUNCEMENT_CATEGORIES = [
  'announcement',
  'video',
  'event',
  'update',
] as const;

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> =
  {
    announcement: 'お知らせ',
    video: '動画',
    event: 'イベント',
    update: '更新',
  };

export type Announcement = {
  id: string;
  /** Legacy mirror of title_ja (kept for older rows / API clients). */
  title?: string | null;
  content?: string | null;
  title_ja?: string | null;
  title_en?: string | null;
  title_id?: string | null;
  content_ja?: string | null;
  content_en?: string | null;
  content_id?: string | null;
  category: AnnouncementCategory;
  published_at: string;
  featured_image?: string | null;
  youtube_url?: string | null;
  is_featured: boolean;
  is_published: boolean;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementInput = {
  title_ja: string;
  title_en?: string | null;
  title_id?: string | null;
  content_ja?: string | null;
  content_en?: string | null;
  content_id?: string | null;
  category?: AnnouncementCategory;
  published_at?: string | null;
  featured_image?: string | null;
  youtube_url?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
};

export type AnnouncementListParams = {
  publishedOnly?: boolean;
  category?: AnnouncementCategory | '';
  featured?: boolean;
  page?: number;
  limit?: number;
};

export type AnnouncementListResponse = {
  items: Announcement[];
  total: number;
  page: number;
  limit: number;
};

export type AnnouncementStats = {
  total: number;
  published_count: number;
  featured_count: number;
};

export type AppContentLang = 'ja' | 'en' | 'id';

export function normalizeContentLang(lang?: string | null): AppContentLang {
  const code = (lang || 'ja').slice(0, 2).toLowerCase();
  if (code === 'en' || code === 'id') return code;
  return 'ja';
}

function pickLocalized(
  primary: string | null | undefined,
  fallbackJa: string | null | undefined,
  legacy?: string | null | undefined,
): string {
  const first = primary?.trim();
  if (first) return first;
  const second = fallbackJa?.trim();
  if (second) return second;
  return legacy?.trim() || '';
}

/** Resolve title for the active UI language with ja fallback. */
export function localizedAnnouncementTitle(
  item: Pick<
    Announcement,
    'title' | 'title_ja' | 'title_en' | 'title_id'
  >,
  lang?: string | null,
): string {
  const code = normalizeContentLang(lang);
  const ja = item.title_ja || item.title;
  if (code === 'en') return pickLocalized(item.title_en, ja);
  if (code === 'id') return pickLocalized(item.title_id, ja);
  return pickLocalized(ja, item.title);
}

/** Resolve body for the active UI language with ja fallback. */
export function localizedAnnouncementContent(
  item: Pick<
    Announcement,
    'content' | 'content_ja' | 'content_en' | 'content_id'
  >,
  lang?: string | null,
): string {
  const code = normalizeContentLang(lang);
  const ja = item.content_ja ?? item.content;
  if (code === 'en') return pickLocalized(item.content_en, ja);
  if (code === 'id') return pickLocalized(item.content_id, ja);
  return pickLocalized(ja, item.content);
}

export function announcementSummary(content?: string | null, maxLength = 120) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value?: string | null) {
  const text = (value || '').trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString();
}

export type AnnouncementPublishState =
  | 'unpublished'
  | 'scheduled'
  | 'live'
  | 'ended';

/**
 * Mirrors the backend's is_row_publicly_visible/is_within_publish_window
 * (utils/publish_window.py) so the admin list can show whether an
 * "is_published" row is actually visible on the public site right now,
 * not yet started, or already past its end date.
 */
export function announcementPublishState(
  item: Pick<Announcement, 'is_published' | 'publish_start_at' | 'publish_end_at'>,
  now: Date = new Date(),
): AnnouncementPublishState {
  if (!item.is_published) return 'unpublished';
  const start = item.publish_start_at ? new Date(item.publish_start_at) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return 'scheduled';
  const end = item.publish_end_at ? new Date(item.publish_end_at) : null;
  if (end && !Number.isNaN(end.getTime()) && now > end) return 'ended';
  return 'live';
}

export function adminAnnouncementTitle(
  item: Pick<Announcement, 'title' | 'title_ja'>,
) {
  return (item.title_ja || item.title || '').trim();
}
