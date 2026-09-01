import { useTranslation } from 'react-i18next';
import type { Video } from '@/types/video';
import {
  formatPublishedDate,
  formatViewCount,
  youtubeWatchUrl,
} from '@/types/video';
import VideoStatusBadge from '@/components/videos/VideoStatusBadge';
import { Card } from '@/components/ui';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const { t } = useTranslation();

  return (
    <Card hoverable className="overflow-hidden !p-0">
      <a
        href={youtubeWatchUrl(video.youtube_id)}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <div className="aspect-video overflow-hidden">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface text-muted">
              {t('admin.videos.noImage')}
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-2">
            <VideoStatusBadge
              label={
                video.is_visible
                  ? t('admin.common.visible')
                  : t('admin.common.hidden')
              }
              tone={video.is_visible ? 'green' : 'muted'}
            />
            {video.category && (
              <VideoStatusBadge label={video.category} tone="gold" />
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {video.title}
          </h3>
          <p className="text-xs text-muted">
            {formatViewCount(video.views || 0)} ·{' '}
            {formatPublishedDate(video.published_at)}
          </p>
        </div>
      </a>
    </Card>
  );
}
