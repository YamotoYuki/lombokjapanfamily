import { useTranslation } from 'react-i18next';
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
  label,
  placeholder,
}: BlogEditorProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('admin.blog.body');
  const resolvedPlaceholder = placeholder ?? t('admin.blog.bodyPlaceholder');

  return (
    <div className="space-y-2">
      <Textarea
        label={resolvedLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={16}
        placeholder={resolvedPlaceholder}
        error={error}
      />
      <p className="text-xs text-muted">{t('admin.blog.editorHint')}</p>
    </div>
  );
}
