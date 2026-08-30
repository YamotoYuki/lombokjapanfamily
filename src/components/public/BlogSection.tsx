import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import PublicBlogCard from '@/components/public/blog/PublicBlogCard';
import { usePublicPosts } from '@/hooks/usePosts';

export default function BlogSection() {
  const { t } = useTranslation();
  const postsQuery = usePublicPosts({ page: 1, limit: 3 });
  const posts = postsQuery.data?.items ?? [];

  return (
    <section id="blog" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <FadeIn>
        <SectionHeading
          eyebrow={t('blog.sectionEyebrow')}
          title={t('blog.sectionTitle')}
          description={t('blog.sectionDescription')}
          action={
            <Link
              to="/blog"
              className="text-sm font-medium text-gold transition-colors hover:text-amber-300"
            >
              {t('blog.viewAll')}
            </Link>
          }
        />
      </FadeIn>

      {postsQuery.isLoading && (
        <div className="rounded-2xl border border-white/10 px-6 py-12 text-center text-sm text-muted">
          {t('blog.loading')}
        </div>
      )}

      {!postsQuery.isLoading && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-sm text-muted">
          {t('blog.empty')}
        </div>
      )}

      {posts.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <FadeIn key={post.id} delayMs={index * 80}>
              <PublicBlogCard post={post} />
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
