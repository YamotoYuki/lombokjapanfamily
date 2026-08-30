import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Mail, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RelatedPosts from '@/components/public/blog/RelatedPosts';
import { YOUTUBE_CHANNEL_URL } from '@/data/publicDummy';
import { formatPostDate, type Post } from '@/types/post';

interface PublicBlogDetailProps {
  post: Post;
  related: Post[];
}

export default function PublicBlogDetail({
  post,
  related,
}: PublicBlogDetailProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const title = post.seo_title || post.title;
  const description =
    post.seo_description ||
    post.excerpt ||
    (post.content ?? '').slice(0, 140) ||
    post.title;

  return (
    <>
      <Helmet>
        <title>{`${title} | Lombok-Japan Family`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {post.featured_image && (
          <meta property="og:image" content={post.featured_image} />
        )}
      </Helmet>

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
          {post.category && (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-gold ring-1 ring-gold/30">
              {post.category.name}
            </span>
          )}
          <span>{formatPostDate(post.published_at, lang)}</span>
        </div>

        <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-5 text-base leading-relaxed text-white/75 md:text-lg">
            {post.excerpt}
          </p>
        )}

        {post.featured_image && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <img
              src={post.featured_image}
              alt={post.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        {(post.tags?.length ?? 0) > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <span key={tag.id} className="text-xs text-muted">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="prose-invert mt-10 whitespace-pre-wrap text-base leading-8 text-white/85">
          {post.content || t('blog.noContent')}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white"
          >
            <Youtube size={16} />
            {t('blog.watchYoutube')}
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold"
          >
            <Mail size={16} />
            {t('blog.contactCta')}
          </Link>
        </div>

        <RelatedPosts posts={related} />

        <div className="mt-10">
          <Link
            to="/blog"
            className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold"
          >
            <ArrowLeft size={16} aria-hidden />
            {t('blog.backToList')}
          </Link>
        </div>
      </article>
    </>
  );
}
