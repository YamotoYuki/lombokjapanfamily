import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Activity,
  Globe2,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { Settings } from '@/types/settings';

interface SettingsStatusCardProps {
  settings?: Settings;
  isLoading?: boolean;
}

export default function SettingsStatusCard({
  settings,
  isLoading,
}: SettingsStatusCardProps) {
  const { t } = useTranslation();
  const snsCount = [
    settings?.youtube_channel_url,
    settings?.instagram_url,
    settings?.tiktok_url,
    settings?.facebook_url,
    settings?.x_url,
  ].filter(Boolean).length;

  const gaReady = Boolean(settings?.ga4_measurement_id);

  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title={t('admin.dashboard.siteSettings')}
        subtitle={t('admin.dashboard.publishStatus')}
        actionLabel={t('admin.common.settings')}
        actionTo="/admin/settings"
      />
      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-youtube-red/15 text-youtube-red">
              <Globe2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                {t('admin.dashboard.currentSiteName')}
              </p>
              <p className="truncate text-sm font-medium text-white">
                {settings?.site_name || t('admin.common.dash')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl',
                settings?.maintenance_mode
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300',
              ].join(' ')}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-xs text-muted">
                {t('admin.dashboard.maintenance')}
              </p>
              <p className="text-sm font-medium text-white">
                {settings?.maintenance_mode
                  ? t('admin.dashboard.maintenanceOn')
                  : t('admin.dashboard.maintenanceOff')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
              <Radio size={18} />
            </div>
            <div>
              <p className="text-xs text-muted">
                {t('admin.dashboard.snsConnected')}
              </p>
              <p className="text-sm font-medium text-white">
                {t('admin.dashboard.snsConfigured', { count: snsCount })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl',
                gaReady
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'bg-white/10 text-muted',
              ].join(' ')}
            >
              <Activity size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{t('admin.dashboard.ga4')}</p>
              <p className="truncate text-sm font-medium text-white">
                {gaReady
                  ? settings?.ga4_measurement_id
                  : t('admin.common.unset')}
              </p>
            </div>
          </div>

          <Link
            to="/admin/settings"
            className="block rounded-2xl border border-white/10 px-3 py-2 text-center text-xs text-muted transition hover:border-gold/40 hover:text-gold"
          >
            {t('admin.dashboard.openSettings')}
          </Link>
        </div>
      )}
    </Card>
  );
}
