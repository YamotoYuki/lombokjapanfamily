import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { categoryIcon } from '@/components/public/blog/blogCategoryIcons';
import { usePublicPosts } from '@/hooks/usePosts';
import { translateCategoryName } from '@/lib/publicLabels';
import {
  formatPostDate,
  localizedPostTitle,
  type PostCategory,
  type PostTag,
} from '@/types/post';

interface BlogSidebarProps {
  category: string;
  tag: string;
  categories: PostCategory[];
  tags: PostTag[];
  onCategoryChange: (value: string) => void;
  onTagChange: (value: string) => void;
}

const RECENT_POSTS_LIMIT = 5;

export default function BlogSidebar({
  category,
  tag,
  categories,
  tags,
  onCategoryChange,
  onTagChange,
}: BlogSidebarProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  // Independent of the active filters — always shows the true latest posts.
  const recentQuery = usePublicPosts({ page: 1, limit: RECENT_POSTS_LIMIT });
  const recentPosts = recentQuery.data?.items ?? [];
  const visibleTags = tags.slice(0, 16);

  return (
    <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
          {t('blog.categoriesTitle')}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className={[
              'touch-target inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors lg:gap-2.5 lg:rounded-2xl lg:border-0 lg:py-2.5 lg:text-left lg:text-sm',
              !category
                ? 'border-youtube-red/40 bg-youtube-red/20 text-white lg:border-0'
                : 'border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-white lg:border-0 lg:bg-transparent lg:hover:bg-white/5',
            ].join(' ')}
          >
            <Tag size={16} className="shrink-0" aria-hidden />
            {t('common.all')}
          </button>
          {categories.map((item) => {
            const Icon = categoryIcon(item.slug);
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCategoryChange(item.id)}
                className={[
                  'touch-target inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors lg:gap-2.5 lg:rounded-2xl lg:border-0 lg:py-2.5 lg:text-left lg:text-sm',
                  active
                    ? 'border-youtube-red/40 bg-youtube-red/20 text-white lg:border-0'
                    : 'border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-white lg:border-0 lg:bg-transparent lg:hover:bg-white/5',
                ].join(' ')}
              >
                <Icon size={16} className="shrink-0" aria-hidden />
                <span className="truncate">
                  {translateCategoryName(item.name, t, item.slug)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleTags.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            {t('blog.tagsTitle')}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleTags.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTagChange(tag === item.slug ? '' : item.slug)}
                className={[
                  'touch-target rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  tag === item.slug
                    ? 'bg-gold/20 text-gold ring-1 ring-gold/40'
                    : 'border border-white/10 text-muted hover:text-gold',
                ].join(' ')}
              >
                #{item.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recentPosts.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            {t('blog.recentTitle')}
          </h3>
          <div className="mt-4 space-y-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex items-center gap-3 rounded-xl transition-colors hover:bg-white/5"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <p className="line-clamp-2 text-sm font-medium text-white transition-colors group-hover:text-gold">
                    {localizedPostTitle(post, lang)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatPostDate(post.published_at, lang)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
