import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  formatPostDate,
  localizedPostContent,
  localizedPostExcerpt,
  localizedPostTitle,
  type Post,
} from '@/types/post';

interface PublicBlogCardProps {
  post: Post;
}

export default function PublicBlogCard({ post }: PublicBlogCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const title = localizedPostTitle(post, lang);
  const excerpt =
    localizedPostExcerpt(post, lang) ||
    localizedPostContent(post, lang).slice(0, 120);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-gold/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={title}
              className="block h-44 w-full object-cover object-center sm:h-48"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center bg-white/[0.02] text-sm text-muted">
              {t('common.noImage')}
            </div>
          )}
          {post.category && (
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gold backdrop-blur">
              {post.category.name}
            </span>
          )}
        </div>
        <div className="space-y-3 p-5">
          <p className="text-xs text-muted">
            {formatPostDate(post.published_at, lang)}
          </p>
          <h3 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-gold">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {excerpt || t('blog.noContent')}
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-white/80">
            {t('blog.readMore')}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}
