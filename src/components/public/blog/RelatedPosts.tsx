import { useTranslation } from 'react-i18next';
import PublicBlogCard from '@/components/public/blog/PublicBlogCard';
import type { Post } from '@/types/post';

interface RelatedPostsProps {
  posts: Post[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  const { t } = useTranslation();
  if (posts.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-white">
        {t('blog.related')}
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PublicBlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
