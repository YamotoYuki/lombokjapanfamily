import { Play } from 'lucide-react';
import type { PublicVideo } from '@/types/public';

interface VideoCardProps {
  video: PublicVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <a
      href={video.youtubeUrl}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-youtube-red/40 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-youtube-red text-white shadow-xl shadow-youtube-red/40">
            <Play size={22} fill="currentColor" />
          </span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-1 text-[11px] font-medium text-white">
          {video.duration}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white md:text-base">
          {video.title}
        </h3>
        <p className="text-xs text-muted">
          {video.views} · {video.publishedAt}
        </p>
      </div>
    </a>
  );
}
