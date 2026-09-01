import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AdminResourceNotFoundProps {
  resourceLabel: string;
  backTo: string;
  backLabel?: string;
  detail?: string;
}

export default function AdminResourceNotFound({
  resourceLabel,
  backTo,
  backLabel,
  detail,
}: AdminResourceNotFoundProps) {
  const { t } = useTranslation();
  const resolvedBack = backLabel ?? t('admin.common.backToList');
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-5 py-8 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">404</p>
      <h2 className="text-xl font-semibold text-white">
        {t('admin.common.notFound', { resource: resourceLabel })}
      </h2>
      <p className="text-sm text-red-200/90">
        {detail || t('admin.common.notFoundDetail')}
      </p>
      <Link
        to={backTo}
        className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:border-gold/40 hover:text-gold"
      >
        ← {resolvedBack}
      </Link>
    </div>
  );
}
