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

export type VideoUpdatePayload = Partial<{
  category: string | null;
  is_featured: boolean;
  is_visible: boolean;
  show_on_home: boolean;
  display_order: number;
}>;

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
  channel?: {
    id?: string;
    title?: string;
    subscriber_count?: number;
    video_count?: number;
    total_view_count?: number;
    view_count?: number;
    thumbnail_url?: string;
  };
};

export type ChannelStats = {
  available: boolean;
  subscriber_count: number;
  video_count: number;
  total_view_count: number;
  synced_at?: string;
  channel_id?: string;
  title?: string;
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

export function formatViewCount(views: number, lang = 'ja') {
  const code = lang.slice(0, 2);
  if (code === 'ja') {
    if (views >= 100_000_000) {
      return `${(views / 100_000_000).toFixed(1)}億回`;
    }
    if (views >= 10_000) {
      return `${(views / 10_000).toFixed(views >= 100_000 ? 0 : 1)}万回`;
    }
    return `${views.toLocaleString('ja-JP')}回`;
  }
  const locale = code === 'id' ? 'id-ID' : 'en-US';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(views);
}

export function formatPublishedDate(value?: string, lang = 'ja') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale =
    lang.slice(0, 2) === 'en'
      ? 'en-US'
      : lang.slice(0, 2) === 'id'
        ? 'id-ID'
        : 'ja-JP';
  return date.toLocaleDateString(locale);
}

/**
 * Popular video selection for TOP / Videos pages.
 * Priority: featured → view count → newest. Max `limit` items.
 */
export function selectPopularVideos(items: Video[], limit = 6): Video[] {
  const visible = items.filter((video) => video.is_visible !== false);
  if (visible.length === 0) return [];

  const featured = visible.filter((video) => video.is_featured);
  if (featured.length > 0) {
    return [...featured]
      .sort((a, b) => {
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        return (
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime()
        );
      })
      .slice(0, limit);
  }

  const hasViews = visible.some((video) => (video.views || 0) > 0);
  if (hasViews) {
    return [...visible]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }

  return [...visible]
    .sort(
      (a, b) =>
        new Date(b.published_at || 0).getTime() -
        new Date(a.published_at || 0).getTime(),
    )
    .slice(0, limit);
}

