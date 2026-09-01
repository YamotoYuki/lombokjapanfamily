import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type { GalleryCategory } from '@/types/gallery';

interface GalleryFiltersProps {
  keyword: string;
  category: string;
  categories: GalleryCategory[];
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function GalleryFilters({
  keyword,
  category,
  categories,
  onKeywordChange,
  onCategoryChange,
}: GalleryFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-[1.4fr_0.8fr]">
      <Input
        label={t('admin.gallery.keyword')}
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={t('admin.gallery.keywordPlaceholder')}
      />
      <div className="space-y-2">
        <label className="text-sm text-muted">
          {t('admin.gallery.category')}
        </label>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="touch-input min-h-11 w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">{t('admin.common.all')}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
