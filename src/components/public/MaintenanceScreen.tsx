import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/public/LanguageSwitcher';
import type { Settings } from '@/types/settings';

interface MaintenanceScreenProps {
  settings?: Settings | null;
  bypass?: boolean;
}

export default function MaintenanceScreen({
  settings,
  bypass,
}: MaintenanceScreenProps) {
  const { t, i18n } = useTranslation();
  const site = settings?.site_name || 'Lombok-Japan Family';
  const lang = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);
  const customMessage =
    lang === 'en'
      ? settings?.maintenance_message_en
      : lang === 'id'
        ? settings?.maintenance_message_id
        : settings?.maintenance_message_ja;
  const body = customMessage?.trim() || t('maintenance.body', { site });

  return (
    <div className="relative flex min-h-screen flex-col bg-primary-bg px-4 py-4 text-center sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.18),transparent_55%)]" />
      <div className="relative flex justify-end">
        <LanguageSwitcher compact />
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center px-2 py-8">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={site}
              className="mx-auto mb-5 h-12 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <p className="mb-5 font-display text-xl font-semibold tracking-tight">
              <span className="text-youtube-red">Lombok</span>
              <span className="text-white">-Japan </span>
              <span className="text-gold">Family</span>
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Maintenance
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">
            {t('maintenance.title')}
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
            {body}
          </p>
          {bypass ? (
            <p className="mt-6 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold">
              {t('maintenance.adminBypass')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
