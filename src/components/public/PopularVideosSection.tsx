import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import VideoCard from '@/components/public/VideoCard';
import { useHomeVideos } from '@/hooks/useVideos';
import {
  formatPublishedDate,
  formatViewCount,
  youtubeWatchUrl,
} from '@/types/video';
import type { PublicVideo } from '@/types/public';
import { popularVideos as fallbackVideos } from '@/data/publicDummy';

interface PopularVideosSectionProps {
  showArchiveLink?: boolean;
}

export default function PopularVideosSection({
  showArchiveLink = true,
}: PopularVideosSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useHomeVideos();

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
    <section
      id="popular-videos"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <FadeIn>
        <SectionHeading
          eyebrow={t('videos.eyebrow')}
          title={t('videos.title')}
          description={t('videos.description')}
          action={
            showArchiveLink ? (
              <Link
                to="/videos"
                className="text-sm font-medium text-gold transition-colors hover:text-amber-300"
              >
                {t('videos.viewAll')}
              </Link>
            ) : undefined
          }
        />
      </FadeIn>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-muted">
          {t('videos.loading')}
        </div>
      )}

      {isError && (
        <div className="mb-6 rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
          {error instanceof Error ? error.message : t('videos.errorFallback')}
        </div>
      )}

      {!isLoading && videos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
          {t('videos.empty')}
        </div>
      )}

      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {videos.map((video, index) => (
            <FadeIn key={video.id} delayMs={index * 80}>
              <VideoCard video={video} />
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
