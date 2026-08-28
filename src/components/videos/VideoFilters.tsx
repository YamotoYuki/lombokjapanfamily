import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
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
  return (
    <CardFiltersShell>
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="タイトル・説明で検索..."
          aria-label="動画検索"
          className="!pl-9"
        />
      </div>

      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red"
        aria-label="カテゴリフィルター"
      >
        <option value="">すべてのカテゴリ</option>
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
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red"
        aria-label="公開状態フィルター"
      >
        <option value="all">すべて</option>
        <option value="visible">公開中</option>
        <option value="hidden">非公開</option>
      </select>
    </CardFiltersShell>
  );
}

function CardFiltersShell({ children }: { children: ReactNode }) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
      {children}
    </div>
  );
}
