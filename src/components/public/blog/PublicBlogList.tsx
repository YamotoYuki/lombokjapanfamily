import { useTranslation } from 'react-i18next';
import PublicBlogListItem from '@/components/public/blog/PublicBlogListItem';
import FadeIn from '@/components/public/FadeIn';
import type { Post } from '@/types/post';

interface PublicBlogListProps {
  posts: Post[];
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function PublicBlogList({
  posts,
  page,
  total,
  limit,
  onPageChange,
}: PublicBlogListProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        {t('blog.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        {posts.map((post, index) => (
          <FadeIn key={post.id} delayMs={index * 60}>
            <PublicBlogListItem post={post} reverse={index % 2 === 1} />
          </FadeIn>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="touch-target rounded-xl border border-white/10 px-3 py-2 text-xs text-muted disabled:opacity-40"
          >
            {t('common.prev')}
          </button>
          <span className="text-xs text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="touch-target rounded-xl border border-white/10 px-3 py-2 text-xs text-muted disabled:opacity-40"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
