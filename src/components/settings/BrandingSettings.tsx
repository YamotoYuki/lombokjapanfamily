import type { Settings } from '@/types/settings';
import LogoUploader from './LogoUploader';
import FaviconUploader from './FaviconUploader';

interface BrandingSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onUploadLogo: (file: File) => Promise<void>;
  onUploadFavicon: (file: File) => Promise<void>;
  uploadingLogo?: boolean;
  uploadingFavicon?: boolean;
}

export default function BrandingSettings({
  value,
  onChange,
  onUploadLogo,
  onUploadFavicon,
  uploadingLogo,
  uploadingFavicon,
}: BrandingSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">ブランディング</h3>
        <p className="mt-1 text-sm text-muted">
          ロゴ・ファビコンはヘッダーとブラウザタブに反映されます。
        </p>
      </div>
      <LogoUploader
        label="ロゴ"
        hint="png / jpg / svg / webp"
        previewUrl={value.logo_url}
        onUpload={onUploadLogo}
        uploading={uploadingLogo}
      />
      <input
        className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white"
        value={value.logo_url ?? ''}
        onChange={(e) => onChange({ logo_url: e.target.value })}
        placeholder="ロゴURL（手動）"
      />
      <FaviconUploader
        previewUrl={value.favicon_url}
        onUpload={onUploadFavicon}
        uploading={uploadingFavicon}
      />
      <input
        className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white"
        value={value.favicon_url ?? ''}
        onChange={(e) => onChange({ favicon_url: e.target.value })}
        placeholder="ファビコンURL（手動）"
      />
    </div>
  );
}
