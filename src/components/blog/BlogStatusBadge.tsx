import { useTranslation } from 'react-i18next';
import type { PostStatus } from '@/types/post';

const toneMap: Record<PostStatus, string> = {
  draft: 'bg-white/10 text-muted ring-white/10',
  scheduled: 'bg-warning/15 text-warning ring-warning/30',
  published: 'bg-success/15 text-success ring-success/30',
  archived: 'bg-youtube-red/15 text-youtube-red ring-youtube-red/30',
};

const STATUS_KEYS: Record<PostStatus, string> = {
  draft: 'admin.blog.statusDraft',
  scheduled: 'admin.blog.statusScheduled',
  published: 'admin.blog.statusPublished',
  archived: 'admin.blog.statusArchived',
};

interface BlogStatusBadgeProps {
  status: PostStatus;
}

export default function BlogStatusBadge({ status }: BlogStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        toneMap[status],
      ].join(' ')}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}
