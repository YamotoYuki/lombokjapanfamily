import { LayoutGrid, Table2 } from 'lucide-react';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  /** When false, the control is hidden (mobile forced card). */
  allowTable?: boolean;
}

export default function ViewModeToggle({
  value,
  onChange,
  className = '',
  allowTable = true,
}: ViewModeToggleProps) {
  if (!allowTable) return null;

  return (
    <div
      className={[
        'inline-flex rounded-2xl border border-white/10 bg-white/5 p-1',
        className,
      ].join(' ')}
      role="group"
      aria-label="表示切替"
    >
      <button
        type="button"
        aria-pressed={value === 'card'}
        onClick={() => onChange('card')}
        className={[
          'touch-target inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors',
          value === 'card'
            ? 'bg-youtube-red/20 text-white'
            : 'text-muted hover:text-white',
        ].join(' ')}
      >
        <LayoutGrid size={16} />
        <span className="hidden sm:inline">カード</span>
      </button>
      <button
        type="button"
        aria-pressed={value === 'table'}
        onClick={() => onChange('table')}
        className={[
          'touch-target inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors',
          value === 'table'
            ? 'bg-youtube-red/20 text-white'
            : 'text-muted hover:text-white',
        ].join(' ')}
      >
        <Table2 size={16} />
        <span className="hidden sm:inline">テーブル</span>
      </button>
    </div>
  );
}
