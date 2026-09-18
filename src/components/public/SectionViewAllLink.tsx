import { LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionViewAllLinkProps {
  to: string;
  label: string;
  className?: string;
}

/** Shared "view all" pill CTA used by the home page's section previews. */
export default function SectionViewAllLink({
  to,
  label,
  className = '',
}: SectionViewAllLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'touch-target inline-flex items-center gap-2 rounded-2xl border border-gold/35 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/20',
        className,
      ].join(' ')}
    >
      <LayoutGrid size={16} aria-hidden />
      {label}
    </Link>
  );
}
