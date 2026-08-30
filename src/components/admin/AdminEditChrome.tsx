import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to={backTo}
            className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={backLabel}
          >
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-gold">
            {eyebrow}
          </p>
          <h2 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 break-words text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
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
    </div>
  );
}
