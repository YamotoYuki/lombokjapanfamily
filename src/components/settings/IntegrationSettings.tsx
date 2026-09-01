import { useTranslation } from 'react-i18next';
import type { Settings } from '@/types/settings';
import { Input } from '@/components/ui';

interface IntegrationSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function IntegrationSettings({
  value,
  onChange,
}: IntegrationSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.integrationsTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.integrationsDescription')}
        </p>
      </div>
      <Input
        label={t('admin.settings.gaId')}
        value={value.ga4_measurement_id ?? ''}
        onChange={(e) => onChange({ ga4_measurement_id: e.target.value })}
        placeholder="G-XXXXXXXXXX"
      />
      <Input
        label={t('admin.settings.gtmId')}
        value={value.google_tag_manager_id ?? ''}
        onChange={(e) => onChange({ google_tag_manager_id: e.target.value })}
        placeholder="GTM-XXXXXXX"
      />
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-muted">
        {t('admin.settings.integrationsTodo')}
      </p>
    </div>
  );
}
