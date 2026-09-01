import { useTranslation } from 'react-i18next';
import type { Settings } from '@/types/settings';
import { Input } from '@/components/ui';

interface SocialSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const FIELD_KEYS: {
  key: keyof Settings;
  labelKey:
    | 'youtubeUrl'
    | 'instagramUrl'
    | 'tiktokUrl'
    | 'facebookUrl'
    | 'xUrl';
  placeholder: string;
}[] = [
  {
    key: 'youtube_channel_url',
    labelKey: 'youtubeUrl',
    placeholder: 'https://www.youtube.com/@lombokjapanfamily',
  },
  {
    key: 'instagram_url',
    labelKey: 'instagramUrl',
    placeholder: 'https://www.instagram.com/tamu.lj',
  },
  {
    key: 'tiktok_url',
    labelKey: 'tiktokUrl',
    placeholder: 'https://www.tiktok.com/@lombokjapanfamily',
  },
  {
    key: 'facebook_url',
    labelKey: 'facebookUrl',
    placeholder: 'https://www.facebook.com/tamulombokjapan/',
  },
  {
    key: 'x_url',
    labelKey: 'xUrl',
    placeholder: 'https://x.com/...',
  },
];

export default function SocialSettings({ value, onChange }: SocialSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.socialTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.socialDescription')}
        </p>
      </div>
      {FIELD_KEYS.map((field) => (
        <Input
          key={field.key}
          label={t(`admin.settings.${field.labelKey}`)}
          value={String(value[field.key] ?? '')}
          onChange={(e) => onChange({ [field.key]: e.target.value })}
          placeholder={field.placeholder}
        />
      ))}
    </div>
  );
}
