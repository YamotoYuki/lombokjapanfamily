import { Eye, Play, Star, Video } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatViewCount } from '@/types/video';
import type { Video as VideoType } from '@/types/video';

interface VideoStatsCardsProps {
  videos: VideoType[];
}

export default function VideoStatsCards({ videos }: VideoStatsCardsProps) {
  const total = videos.length;
  const visible = videos.filter((video) => video.is_visible).length;
  const featured = videos.filter((video) => video.is_featured).length;
  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

  const cards = [
    {
      label: '総動画数',
      value: total.toLocaleString('ja-JP'),
      icon: Video,
      accent: 'text-youtube-red bg-youtube-red/15',
    },
    {
      label: '公開中',
      value: visible.toLocaleString('ja-JP'),
      icon: Eye,
      accent: 'text-success bg-success/15',
    },
    {
      label: 'おすすめ',
      value: featured.toLocaleString('ja-JP'),
      icon: Star,
      accent: 'text-gold bg-gold/15',
    },
    {
      label: '総再生回数',
      value: formatViewCount(totalViews),
      icon: Play,
      accent: 'text-white bg-white/10',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label} hoverable>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
            <div className={['rounded-2xl p-3', accent].join(' ')}>
              <Icon size={18} />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
