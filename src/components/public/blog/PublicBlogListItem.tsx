import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateCategoryName } from '@/lib/publicLabels';
import {
  formatPostDate,
  localizedPostContent,
  localizedPostExcerpt,
  localizedPostTitle,
  type Post,
} from '@/types/post';

interface PublicBlogListItemProps {
  post: Post;
  /** Alternates the image side on wide screens so the list doesn't feel monotonous. */
  reverse?: boolean;
}

export default function PublicBlogListItem({
  post,
  reverse = false,
}: PublicBlogListItemProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const title = localizedPostTitle(post, lang);
  const excerpt =
    localizedPostExcerpt(post, lang) ||
    localizedPostContent(post, lang).slice(0, 160);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-gold/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <Link
        to={`/blog/${post.slug}`}
        className={[
          'flex flex-col sm:flex-row',
          reverse ? 'sm:flex-row-reverse' : '',
        ].join(' ')}
      >
        <div className="relative shrink-0 bg-black/25 sm:w-2/5">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-full sm:min-h-[13rem]"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-white/[0.02] text-sm text-muted sm:h-full sm:min-h-[13rem]">
              {t('common.noImage')}
            </div>
          )}
          {post.category ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gold backdrop-blur">
              {translateCategoryName(post.category.name, t, post.category.slug)}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
          <p className="text-xs text-muted">
            {formatPostDate(post.published_at, lang)}
          </p>
          <h3 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-gold sm:text-2xl">
            {title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {excerpt || t('blog.noContent')}
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-gold/90">
            {t('blog.readMore')}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}
