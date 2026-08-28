import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui';
import type { PostTag } from '@/types/post';

interface TagInputProps {
  value: string[];
  suggestions?: PostTag[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({
  value,
  suggestions = [],
  onChange,
}: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (value.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...value, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        label="タグ"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="入力して Enter（例: 旅行）"
      />
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs text-gold ring-1 ring-gold/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              aria-label={`${tag} を削除`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-gold/40 hover:text-gold"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
