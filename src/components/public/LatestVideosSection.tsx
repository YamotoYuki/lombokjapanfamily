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

interface LatestVideosSectionProps {
  showArchiveLink?: boolean;
}

export default function LatestVideosSection({
  showArchiveLink = true,
}: LatestVideosSectionProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const { data, isLoading, isError, error } = useHomeVideos();

  const videos = useMemo<PublicVideo[]>(() => {
    const items = (data?.items ?? []).slice(0, 6);
    return items.map((video) => ({
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnail_url || '',
      views: formatViewCount(video.views || 0, lang),
      publishedAt: formatPublishedDate(video.published_at, lang),
      duration: video.duration || '',
      youtubeUrl: youtubeWatchUrl(video.youtube_id),
    }));
  }, [data?.items, lang]);

  return (
    <section
      id="latest-videos"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <FadeIn>
        <SectionHeading
          eyebrow={t('videos.latestEyebrow')}
          title={t('videos.latestTitle')}
          description={t('videos.latestDescription')}
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

      {!isLoading && !isError && videos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
          {t('videos.latestEmpty')}
        </div>
      )}

      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
