import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type { PostCategory, PostTag } from '@/types/post';

interface PublicBlogFiltersProps {
  keyword: string;
  category: string;
  tag: string;
  categories: PostCategory[];
  tags: PostTag[];
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagChange: (value: string) => void;
}

export default function PublicBlogFilters({
  keyword,
  category,
  tag,
  categories,
  tags,
  onKeywordChange,
  onCategoryChange,
  onTagChange,
}: PublicBlogFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8 space-y-4">
      <div className="relative max-w-xl">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t('blog.searchPlaceholder')}
          className="!pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            !category
              ? 'bg-youtube-red text-white'
              : 'border border-white/10 text-muted hover:text-white',
          ].join(' ')}
        >
          {t('common.all')}
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onCategoryChange(item.id)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              category === item.id
                ? 'bg-youtube-red text-white'
                : 'border border-white/10 text-muted hover:text-white',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 12).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTagChange(tag === item.slug ? '' : item.slug)}
              className={[
                'rounded-full px-2.5 py-1 text-[11px] transition-colors',
                tag === item.slug
                  ? 'bg-gold/20 text-gold ring-1 ring-gold/40'
                  : 'text-muted hover:text-gold',
              ].join(' ')}
            >
              #{item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
