import type { ReactNode } from 'react';

interface AdminStickyActionsProps {
  children: ReactNode;
  className?: string;
}

/** Sticky action bar for admin edit forms (mobile-first, 44px-friendly). */
export default function AdminStickyActions({
  children,
  className = '',
}: AdminStickyActionsProps) {
  return (
    <div
      className={[
        'sticky bottom-0 z-20 -mx-3 mt-6 border-t border-white/10',
        'bg-primary-bg/95 px-3 py-3 pb-[max(0.75rem,var(--safe-bottom))] backdrop-blur-xl',
        'sm:-mx-0 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-surface/90 sm:px-4',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {children}
      </div>
    </div>
  );
}
