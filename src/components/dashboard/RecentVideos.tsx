import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { RecentVideoItem } from '@/types/dashboard';

interface RecentVideosProps {
  items: RecentVideoItem[];
}

export default function RecentVideos({ items }: RecentVideosProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.recentVideos')}
        subtitle={t('admin.dashboard.channelPosts')}
        actionLabel={t('admin.common.viewAll')}
        actionTo="/admin/videos"
      />
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="group flex gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-2.5 transition-all hover:border-youtube-red/40 hover:bg-primary-bg/70"
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                <Play size={18} className="text-white" fill="currentColor" />
              </div>
            </div>
            <div className="min-w-0 py-0.5">
              <h4 className="line-clamp-2 text-sm font-medium text-white">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[11px] text-muted">
                {item.publishedAt} ·{' '}
                {t('admin.dashboard.viewsLabel', { views: item.views })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
