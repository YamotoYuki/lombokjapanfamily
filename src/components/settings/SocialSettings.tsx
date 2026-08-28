import type { Settings } from '@/types/settings';
import { Input } from '@/components/ui';

interface SocialSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const fields: { key: keyof Settings; label: string; placeholder: string }[] = [
  {
    key: 'youtube_channel_url',
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/@...',
  },
  {
    key: 'instagram_url',
    label: 'Instagram',
    placeholder: 'https://instagram.com/...',
  },
  {
    key: 'tiktok_url',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@...',
  },
  {
    key: 'facebook_url',
    label: 'Facebook',
    placeholder: 'https://facebook.com/...',
  },
  {
    key: 'x_url',
    label: 'X',
    placeholder: 'https://x.com/...',
  },
];

export default function SocialSettings({ value, onChange }: SocialSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">SNS設定</h3>
        <p className="mt-1 text-sm text-muted">
          フッター・ヘッダーの公式SNSリンクに反映されます。
        </p>
      </div>
      {fields.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          value={String(value[field.key] ?? '')}
          onChange={(e) => onChange({ [field.key]: e.target.value })}
          placeholder={field.placeholder}
        />
      ))}
    </div>
  );
}
