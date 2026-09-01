import { useTranslation } from 'react-i18next';
import type { Settings } from '@/types/settings';
import { Input, Textarea } from '@/components/ui';

interface ContactSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function ContactSettings({
  value,
  onChange,
}: ContactSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.contactTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.contactDescription')}
        </p>
      </div>
      <Input
        label={t('admin.settings.contactEmail')}
        type="email"
        value={value.contact_email ?? ''}
        onChange={(e) => onChange({ contact_email: e.target.value })}
        placeholder="hello@example.com"
      />
      <Input
        label={t('admin.settings.contactPhone')}
        value={value.contact_phone ?? ''}
        onChange={(e) => onChange({ contact_phone: e.target.value })}
        placeholder="+81-..."
      />
      <Textarea
        label={t('admin.settings.contactAddress')}
        value={value.contact_address ?? ''}
        onChange={(e) => onChange({ contact_address: e.target.value })}
        rows={3}
      />
    </div>
  );
}
