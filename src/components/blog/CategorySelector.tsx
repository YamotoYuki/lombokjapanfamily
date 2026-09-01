import { useTranslation } from 'react-i18next';
import type { PostCategory } from '@/types/post';

interface CategorySelectorProps {
  categories: PostCategory[];
  value?: string;
  onChange: (value: string) => void;
}

export default function CategorySelector({
  categories,
  value,
  onChange,
}: CategorySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="text-sm font-medium text-muted">
        {t('admin.common.category')}
      </label>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red"
      >
        <option value="">{t('admin.common.unset')}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
