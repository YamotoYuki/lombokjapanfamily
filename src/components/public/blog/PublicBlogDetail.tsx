import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ArticleAccentLine,
  ArticleBackLink,
  ArticleHeroImage,
  ArticleParagraphs,
} from '@/components/public/ArticleDetailKit';
import RelatedPosts from '@/components/public/blog/RelatedPosts';
import { YOUTUBE_CHANNEL_URL } from '@/data/brand';
import { articleDateLabel, splitArticleParagraphs } from '@/lib/articleContent';
import { translateCategoryName } from '@/lib/publicLabels';
import {
  localizedPostContent,
  localizedPostExcerpt,
  localizedPostTitle,
  type Post,
} from '@/types/post';

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
  const displayTitle = localizedPostTitle(post, lang);
  const displayExcerpt = localizedPostExcerpt(post, lang);
  const displayContent = localizedPostContent(post, lang);
  const paragraphs = splitArticleParagraphs(displayContent);
  const dateLabel = articleDateLabel(post.published_at);
  const categoryLabel = post.category
    ? translateCategoryName(post.category.name, t, post.category.slug)
    : '';
  const title = post.seo_title || displayTitle;
  const description =
    post.seo_description ||
    displayExcerpt ||
    displayContent.slice(0, 140) ||
    displayTitle;

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

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-24">
        {/* 1. Section masthead */}
        <div className="animate-fade-up">
          <p className="font-display text-3xl font-medium tracking-[0.35em] text-white/50 sm:text-4xl">
            BLOG
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-gold">
            {t('nav.blog')}
          </p>
        </div>

        {/* 2. Date / category */}
        <div className="animate-fade-up delay-100 mt-8 flex flex-wrap items-center gap-3 text-sm text-muted">
          {dateLabel ? (
            <span className="tabular-nums tracking-wide">{dateLabel}</span>
          ) : null}
          {dateLabel && categoryLabel ? (
            <span className="text-white/20" aria-hidden>
              /
            </span>
          ) : null}
          {categoryLabel ? (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {categoryLabel}
            </span>
          ) : null}
        </div>

        {/* 3. Title */}
        <h1 className="animate-fade-up delay-200 mt-4 break-words font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl">
          {displayTitle}
        </h1>

        {/* 4. Thin accent line */}
        <ArticleAccentLine />

        {/* 5. Hero image */}
        {post.featured_image ? (
          <ArticleHeroImage src={post.featured_image} alt={displayTitle} />
        ) : null}

        {/* A short lede reads as "something to read", not a news brief —
            this is the one deliberate difference from the announcement
            layout the reading-focused blog page should keep. */}
        {displayExcerpt ? (
          <p className="animate-fade-up delay-300 mx-auto mt-8 max-w-2xl break-words text-lg leading-relaxed text-white/75 sm:text-xl">
            {displayExcerpt}
          </p>
        ) : null}

        {(post.tags?.length ?? 0) > 0 ? (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}

        {/* 6. Body — see ArticleParagraphs for why this is a timed reveal
            rather than a scroll-triggered one. Plain-text content, so
            manually-typed bullets/line breaks are preserved as-is via
            white-space: pre-wrap rather than parsed as markdown/HTML. */}
        {paragraphs.length > 0 ? (
          <ArticleParagraphs paragraphs={paragraphs} />
        ) : (
          <p className="animate-fade-up mx-auto mt-10 max-w-2xl text-base text-muted">
            {t('blog.noContent')}
          </p>
        )}

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap gap-3">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            <Youtube size={16} aria-hidden />
            {t('blog.watchYoutube')}
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <Mail size={16} aria-hidden />
            {t('blog.contactCta')}
          </Link>
        </div>

        <RelatedPosts posts={related} />

        <div className="mt-14">
          <ArticleBackLink to="/blog" label={t('blog.backToList')} />
        </div>
      </article>
    </>
  );
}
