import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import {
  VIDEO_CATEGORIES,
  type VideoVisibilityFilter,
} from '@/types/video';

interface VideoFiltersProps {
  keyword: string;
  category: string;
  visibility: VideoVisibilityFilter;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onVisibilityChange: (value: VideoVisibilityFilter) => void;
}

export default function VideoFilters({
  keyword,
  category,
  visibility,
  onKeywordChange,
  onCategoryChange,
  onVisibilityChange,
}: VideoFiltersProps) {
  const { t } = useTranslation();

  return (
    <CardFiltersShell>
      <div className="relative min-w-0 flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t('admin.videos.searchPlaceholder')}
          aria-label={t('admin.videos.searchAria')}
          className="!pl-9"
        />
      </div>

      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="touch-input min-h-11 w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red md:w-auto"
        aria-label={t('admin.videos.categoryFilterAria')}
      >
        <option value="">{t('admin.videos.allCategories')}</option>
        {VIDEO_CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={visibility}
        onChange={(event) =>
          onVisibilityChange(event.target.value as VideoVisibilityFilter)
        }
        className="touch-input min-h-11 w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red md:w-auto"
        aria-label={t('admin.videos.visibilityFilterAria')}
      >
        <option value="all">{t('admin.common.all')}</option>
        <option value="visible">{t('admin.videos.statVisible')}</option>
        <option value="hidden">{t('admin.common.hidden')}</option>
      </select>
    </CardFiltersShell>
  );
}

function CardFiltersShell({ children }: { children: ReactNode }) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-3 sm:p-4 md:flex-row md:items-center">
      {children}
    </div>
  );
}
