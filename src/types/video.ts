export type Video = {
  id: string;
  youtube_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  channel_title?: string;
  category?: string;
  tags?: string[];
  views: number;
  likes: number;
  comments: number;
  duration?: string;
  published_at?: string;
  is_featured: boolean;
  is_visible: boolean;
  show_on_home: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type VideoUpdatePayload = Partial<
  Pick<
    Video,
    | 'category'
    | 'is_featured'
    | 'is_visible'
    | 'show_on_home'
    | 'display_order'
  >
>;

export type VideoVisibilityFilter = 'all' | 'visible' | 'hidden';

export type VideoListParams = {
  q?: string;
  category?: string;
  is_visible?: boolean;
  is_featured?: boolean;
  show_on_home?: boolean;
};

export type VideoListResponse = {
  items: Video[];
  total: number;
};

export type VideoSyncResponse = {
  synced: number;
  items: Video[];
};

export const VIDEO_CATEGORIES = [
  '旅行',
  '日常',
  'イベント',
  '子供',
  'インドネシア',
  '日本',
  '国際結婚',
  '文化',
  'Vlog',
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function formatViewCount(views: number) {
  if (views >= 100_000_000) {
    return `${(views / 100_000_000).toFixed(1)}億回`;
  }
  if (views >= 10_000) {
    return `${(views / 10_000).toFixed(views >= 100_000 ? 0 : 1)}万回`;
  }
  return `${views.toLocaleString('ja-JP')}回`;
}

export function formatPublishedDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ja-JP');
}
