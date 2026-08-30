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
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-[1.4fr_0.8fr]">
      <Input
        label="キーワード"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="タイトル・説明・場所"
      />
      <div className="space-y-2">
        <label className="text-sm text-muted">カテゴリー</label>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="touch-input min-h-11 w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">すべて</option>
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
