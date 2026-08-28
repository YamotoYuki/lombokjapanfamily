import { Search } from 'lucide-react';
import { Input } from '@/components/ui';
import type { PostCategory, PostStatus } from '@/types/post';

interface BlogFiltersProps {
  keyword: string;
  category: string;
  status: PostStatus | '';
  categories: PostCategory[];
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: PostStatus | '') => void;
}

export default function BlogFilters({
  keyword,
  category,
  status,
  categories,
  onKeywordChange,
  onCategoryChange,
  onStatusChange,
}: BlogFiltersProps) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="タイトル・本文で検索..."
          className="!pl-9"
        />
      </div>
      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">すべてのカテゴリー</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as PostStatus | '')
        }
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">すべてのステータス</option>
        <option value="draft">下書き</option>
        <option value="scheduled">公開予約</option>
        <option value="published">公開済み</option>
        <option value="archived">削除済み</option>
      </select>
    </div>
  );
}
