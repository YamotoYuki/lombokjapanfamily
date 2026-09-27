import { useTranslation } from 'react-i18next';
import PublicBlogListItem from '@/components/public/blog/PublicBlogListItem';
import FadeIn from '@/components/public/FadeIn';
import { Pagination } from '@/components/ui';
import { computeTotalPages } from '@/lib/pagination';
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
  const totalPages = computeTotalPages(total, limit);

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

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
