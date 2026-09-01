import { useTranslation } from 'react-i18next';
import type { Settings } from '@/types/settings';
import { Input, Textarea } from '@/components/ui';

interface GeneralSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function GeneralSettings({ value, onChange }: GeneralSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.generalTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.generalDescription')}
        </p>
      </div>
      <Input
        label={t('admin.settings.siteName')}
        value={value.site_name}
        onChange={(e) => onChange({ site_name: e.target.value })}
        placeholder="Lombok-Japan Family"
      />
      <Textarea
        label={t('admin.settings.siteDescription')}
        value={value.site_description}
        onChange={(e) => onChange({ site_description: e.target.value })}
        rows={4}
        placeholder={t('admin.settings.siteDescriptionPlaceholder')}
      />
    </div>
  );
}
