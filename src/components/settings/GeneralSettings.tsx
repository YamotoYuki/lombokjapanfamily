import type { Settings } from '@/types/settings';
import { Input, Textarea } from '@/components/ui';

interface GeneralSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function GeneralSettings({ value, onChange }: GeneralSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">サイト基本設定</h3>
        <p className="mt-1 text-sm text-muted">
          サイト名・説明文はヘッダー・フッター・SEOの基盤になります。
        </p>
      </div>
      <Input
        label="サイト名"
        value={value.site_name}
        onChange={(e) => onChange({ site_name: e.target.value })}
        placeholder="Lombok-Japan Family"
      />
      <Textarea
        label="サイト説明"
        value={value.site_description}
        onChange={(e) => onChange({ site_description: e.target.value })}
        rows={4}
        placeholder="サイトの概要を入力"
      />
    </div>
  );
}
