import { useMemo } from 'react';
import { Youtube } from 'lucide-react';
import {
  FadeIn,
  PageHero,
  PopularVideosSection,
  VideoCard,
} from '@/components/public';
import { YOUTUBE_CHANNEL_URL, YOUTUBE_SUBSCRIBE_URL } from '@/data/brand';
import { useSettings } from '@/hooks/useSettings';
import { useVideos } from '@/hooks/useVideos';
import {
  formatPublishedDate,
  formatViewCount,
  youtubeWatchUrl,
} from '@/types/video';
import type { PublicVideo } from '@/types/public';
import { popularVideos as fallbackVideos } from '@/data/publicDummy';

export default function VideosPage() {
  const { data: settings } = useSettings();
  const youtubeUrl = settings?.youtube_channel_url || YOUTUBE_CHANNEL_URL;
  const subscribeUrl = youtubeUrl.includes('sub_confirmation')
    ? youtubeUrl
    : `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}sub_confirmation=1`;

  const { data, isLoading, isError, error } = useVideos({ is_visible: true });

  const videos = useMemo<PublicVideo[]>(() => {
    const items = data?.items ?? [];
    if (items.length > 0) {
      return items.map((video) => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url || '',
        views: formatViewCount(video.views || 0),
        publishedAt: formatPublishedDate(video.published_at),
        duration: video.duration || '',
        youtubeUrl: youtubeWatchUrl(video.youtube_id),
      }));
    }

    if (isError) {
      return fallbackVideos;
    }

    return [];
  }, [data?.items, isError]);

  return (
    <>
      <PageHero
        eyebrow="Videos"
        title="All Videos"
        description="旅・食・日常・文化交流まで、Lombok-Japan Family のエピソード一覧です。"
        backgroundImage="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop"
      />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-gradient-to-r from-youtube-red/15 via-white/[0.03] to-gold/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              YouTube Channel
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              @lombokjapanfamily
            </p>
            <p className="mt-1 text-sm text-muted">
              最新動画は公式チャンネルで公開しています。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-youtube-red/25 transition-all hover:-translate-y-0.5 hover:bg-red-600"
            >
              <Youtube size={16} aria-hidden />
              チャンネルを見る
            </a>
            <a
              href={subscribeUrl || YOUTUBE_SUBSCRIBE_URL}
              target="_blank"
              rel="noreferrer"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/20"
            >
              チャンネル登録
            </a>
          </div>
        </div>
      </section>

      <PopularVideosSection showArchiveLink={false} />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
            Archive
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
            すべての動画
          </h2>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-muted">
            動画を読み込み中です...
          </div>
        )}

        {isError && (
          <div className="mb-6 rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error instanceof Error
              ? error.message
              : '動画の取得に失敗しました。'}
          </div>
        )}

        {!isLoading && videos.length === 0 && !isError && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
            公開中の動画がまだありません。{' '}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:text-amber-300"
            >
              YouTubeチャンネル
            </a>
            をご覧ください。
          </div>
        )}

        {!isLoading && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {videos.map((video, index) => (
              <FadeIn key={video.id} delayMs={index * 60}>
                <VideoCard video={video} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
