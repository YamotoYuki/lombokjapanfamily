import { useMemo } from 'react';
import { FadeIn, PageHero, VideoCard } from '@/components/public';
import { useVideos } from '@/hooks/useVideos';
import {
  formatPublishedDate,
  formatViewCount,
  youtubeWatchUrl,
} from '@/types/video';
import type { PublicVideo } from '@/types/public';
import { popularVideos as fallbackVideos } from '@/data/publicDummy';

export default function VideosPage() {
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
        description="旅・食・日常・文化交流まで、ファミリーチャンネルのエピソード一覧です。"
        backgroundImage="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
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

        {!isLoading && (
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
