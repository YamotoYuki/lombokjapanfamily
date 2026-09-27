import { useTranslation } from 'react-i18next';
import { getPageWindow } from '@/lib/pagination';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Shared "‹ Prev  1 2 3 … 20  Next ›" pager for public and admin list
 * screens. Renders nothing when there is only one page. */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const items = getPageWindow(page, totalPages);
  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    onPageChange(next);
  };

  return (
    <nav
      aria-label={t('common.pagination')}
      className={['flex flex-wrap items-center justify-center gap-1.5', className].join(' ')}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-white/10 px-3 text-xs text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted sm:text-sm"
      >
        <span aria-hidden="true">‹</span>
        {t('common.prev')}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-muted sm:text-sm"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => go(item)}
              className={[
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors sm:h-9 sm:min-w-9 sm:text-sm',
                item === page
                  ? 'bg-youtube-red text-white'
                  : 'text-muted hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className="touch-target inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-white/10 px-3 text-xs text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted sm:text-sm"
      >
        {t('common.next')}
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
