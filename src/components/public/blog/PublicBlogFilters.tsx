import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';

interface PublicBlogFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
}

export default function PublicBlogFilters({
  keyword,
  onKeywordChange,
}: PublicBlogFiltersProps) {
  const { t } = useTranslation();

  return (
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
  );
}
