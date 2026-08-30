import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { backLinkClassName } from '@/components/ui';

interface AdminEditChromeProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  message?: string | null;
  error?: string | null;
  children: React.ReactNode;
}

export default function AdminEditChrome({
  eyebrow,
  title,
  subtitle,
  backTo,
  backLabel = '一覧へ戻る',
  message,
  error,
  children,
}: AdminEditChromeProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
        <h2 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 break-words text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>

      {(message || error) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      {children}

      <div className="pt-2">
        <Link
          to={backTo}
          className={backLinkClassName}
          aria-label={backLabel}
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
