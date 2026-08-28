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
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">外部連携設定</h3>
        <p className="mt-1 text-sm text-muted">
          公開サイトのトラッキングタグに反映されます（測定IDの管理）。
        </p>
      </div>
      <Input
        label="GA4 Measurement ID"
        value={value.ga4_measurement_id ?? ''}
        onChange={(e) => onChange({ ga4_measurement_id: e.target.value })}
        placeholder="G-XXXXXXXXXX"
      />
      <Input
        label="Google Tag Manager ID"
        value={value.google_tag_manager_id ?? ''}
        onChange={(e) => onChange({ google_tag_manager_id: e.target.value })}
        placeholder="GTM-XXXXXXX"
      />
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-muted">
        TODO: 多言語 / メールテンプレート / CDN / 独自ドメイン / Cloudflare / Push通知
      </p>
    </div>
  );
}
