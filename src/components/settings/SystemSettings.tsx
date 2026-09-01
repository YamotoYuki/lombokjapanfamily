import type { Settings } from '@/types/settings';
import { useTranslation } from 'react-i18next';
import { AdminLanguageSettings } from '@/components/admin';

interface SystemSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function SystemSettings({ value, onChange }: SystemSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.systemTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.systemDescription')}
        </p>
      </div>

      <AdminLanguageSettings />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
        <div>
          <p className="text-sm font-medium text-white">Maintenance Mode</p>
          <p className="mt-1 text-xs text-muted">
            {value.maintenance_mode
              ? t('admin.settings.maintenanceOn')
              : t('admin.settings.maintenanceOff')}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.maintenance_mode}
          onClick={() => onChange({ maintenance_mode: !value.maintenance_mode })}
          className={[
            'relative h-8 w-14 rounded-full transition-colors',
            value.maintenance_mode ? 'bg-youtube-red' : 'bg-white/15',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-6 w-6 rounded-full bg-white transition-transform',
              value.maintenance_mode ? 'left-7' : 'left-1',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}
