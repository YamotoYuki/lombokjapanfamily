import { POST_STATUS_LABEL, type PostStatus } from '@/types/post';

const toneMap: Record<PostStatus, string> = {
  draft: 'bg-white/10 text-muted ring-white/10',
  scheduled: 'bg-warning/15 text-warning ring-warning/30',
  published: 'bg-success/15 text-success ring-success/30',
  archived: 'bg-youtube-red/15 text-youtube-red ring-youtube-red/30',
};

interface BlogStatusBadgeProps {
  status: PostStatus;
}

export default function BlogStatusBadge({ status }: BlogStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        toneMap[status],
      ].join(' ')}
    >
      {POST_STATUS_LABEL[status]}
    </span>
  );
}
