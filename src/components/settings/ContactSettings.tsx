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
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">お問い合わせ設定</h3>
        <p className="mt-1 text-sm text-muted">
          フッターやお問い合わせページに表示する連絡先です。
        </p>
      </div>
      <Input
        label="メール"
        type="email"
        value={value.contact_email ?? ''}
        onChange={(e) => onChange({ contact_email: e.target.value })}
        placeholder="hello@example.com"
      />
      <Input
        label="電話番号"
        value={value.contact_phone ?? ''}
        onChange={(e) => onChange({ contact_phone: e.target.value })}
        placeholder="+81-..."
      />
      <Textarea
        label="住所"
        value={value.contact_address ?? ''}
        onChange={(e) => onChange({ contact_address: e.target.value })}
        rows={3}
      />
    </div>
  );
}
