import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import SectionViewAllLink from '@/components/public/SectionViewAllLink';
import PublicBlogCard from '@/components/public/blog/PublicBlogCard';
import { usePublicPosts } from '@/hooks/usePosts';

export default function BlogSection() {
  const { t } = useTranslation();
  const postsQuery = usePublicPosts({ page: 1, limit: 1 });
  const posts = postsQuery.data?.items ?? [];

  return (
    <section id="blog" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <FadeIn>
        <SectionHeading
          eyebrow={t('blog.sectionEyebrow')}
          title={t('blog.sectionTitle')}
          description={t('blog.sectionDescription')}
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
        <div className="mx-auto max-w-md">
          <FadeIn>
            <PublicBlogCard post={posts[0]} />
          </FadeIn>
        </div>
      )}

      {!postsQuery.isLoading && posts.length > 0 ? (
        <FadeIn delayMs={120}>
          <div className="mt-10 flex justify-center sm:mt-12">
            <SectionViewAllLink to="/blog" label={t('blog.viewAll')} />
          </div>
        </FadeIn>
      ) : null}
    </section>
  );
}
