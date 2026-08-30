import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@/types/settings';

interface MaintenanceScreenProps {
  settings?: Settings | null;
  bypass?: boolean;
}

export default function MaintenanceScreen({
  settings,
  bypass,
}: MaintenanceScreenProps) {
  const { t } = useTranslation();
  const site = settings?.site_name || 'Lombok-Japan Family';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-bg px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.18),transparent_55%)]" />
      <div className="relative max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Maintenance
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">
          {t('maintenance.title')}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t('maintenance.body', { site })}
        </p>
        {bypass ? (
          <p className="mt-6 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold">
            {t('maintenance.adminBypass')}
          </p>
        ) : null}
        <Link
          to="/admin/login"
          className="mt-8 inline-flex rounded-2xl border border-white/15 px-4 py-2.5 text-sm text-white/80 transition hover:border-youtube-red/40 hover:text-white"
        >
          {t('maintenance.adminLogin')}
        </Link>
      </div>
    </div>
  );
}
