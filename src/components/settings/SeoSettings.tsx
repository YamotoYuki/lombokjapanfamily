import type { Settings } from '@/types/settings';
import { Input, Textarea } from '@/components/ui';
import LogoUploader from './LogoUploader';

interface SeoSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onUploadOg: (file: File) => Promise<void>;
  uploadingOg?: boolean;
}

export default function SeoSettings({
  value,
  onChange,
  onUploadOg,
  uploadingOg,
}: SeoSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">SEO設定</h3>
        <p className="mt-1 text-sm text-muted">
          検索結果・SNSシェアに表示されるメタ情報を管理します。
        </p>
      </div>
      <Input
        label="SEOタイトル"
        value={value.seo_title ?? ''}
        onChange={(e) => onChange({ seo_title: e.target.value })}
        placeholder="Lombok-Japan Family | Official Website"
      />
      <Textarea
        label="SEO説明文"
        value={value.seo_description ?? ''}
        onChange={(e) => onChange({ seo_description: e.target.value })}
        rows={3}
      />
      <Input
        label="SEOキーワード"
        value={value.seo_keywords ?? ''}
        onChange={(e) => onChange({ seo_keywords: e.target.value })}
        placeholder="Lombok, Japan, Family, YouTube"
      />
      <LogoUploader
        label="OG画像"
        hint="推奨 1200×630。png / jpg / webp / svg"
        previewUrl={value.og_image_url}
        onUpload={onUploadOg}
        uploading={uploadingOg}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
      />
      <Input
        label="OG画像URL（手動）"
        value={value.og_image_url ?? ''}
        onChange={(e) => onChange({ og_image_url: e.target.value })}
        placeholder="https://..."
      />
    </div>
  );
}
