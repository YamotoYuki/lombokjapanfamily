import { Textarea } from '@/components/ui';

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

/**
 * Simple textarea editor.
 * Designed for future replacement with TipTap / Markdown / MDX.
 */
export default function BlogEditor({
  value,
  onChange,
  error,
  label = '本文',
  placeholder = '記事本文を入力してください（将来 Markdown / TipTap に差し替え予定）',
}: BlogEditorProps) {
  return (
    <div className="space-y-2">
      <Textarea
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={16}
        placeholder={placeholder}
        error={error}
      />
      <p className="text-xs text-muted">
        Editor adapter: Textarea（将来 TipTap / Markdown / MDX へ置換しやすい構成）
      </p>
    </div>
  );
}
