import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.brandingTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.brandingDescription')}
        </p>
      </div>
      <LogoUploader
        label={t('admin.settings.logo')}
        hint={t('admin.settings.logoHint')}
        previewUrl={value.logo_url}
        onUpload={onUploadLogo}
        uploading={uploadingLogo}
      />
      <input
        className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white"
        value={value.logo_url ?? ''}
        onChange={(e) => onChange({ logo_url: e.target.value })}
        placeholder={t('admin.settings.logoManual')}
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
        placeholder={t('admin.settings.faviconManual')}
      />
    </div>
  );
}
