import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  right?: ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionTo,
  right,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="shrink-0 text-xs font-medium text-gold transition-colors hover:text-amber-300"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
