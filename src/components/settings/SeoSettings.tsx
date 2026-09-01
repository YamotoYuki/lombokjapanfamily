import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.seoPanelTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.seoPanelDescription')}
        </p>
      </div>
      <Input
        label={t('admin.settings.metaTitle')}
        value={value.seo_title ?? ''}
        onChange={(e) => onChange({ seo_title: e.target.value })}
        placeholder="Lombok-Japan Family | Official Website"
      />
      <Textarea
        label={t('admin.settings.metaDescription')}
        value={value.seo_description ?? ''}
        onChange={(e) => onChange({ seo_description: e.target.value })}
        rows={3}
      />
      <Input
        label={t('admin.settings.seoKeywords')}
        value={value.seo_keywords ?? ''}
        onChange={(e) => onChange({ seo_keywords: e.target.value })}
        placeholder="Lombok, Japan, Family, YouTube"
      />
      <LogoUploader
        label={t('admin.settings.ogImage')}
        hint={t('admin.settings.ogHint')}
        previewUrl={value.og_image_url}
        onUpload={onUploadOg}
        uploading={uploadingOg}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
      />
      <Input
        label={t('admin.settings.ogImageManual')}
        value={value.og_image_url ?? ''}
        onChange={(e) => onChange({ og_image_url: e.target.value })}
        placeholder="https://..."
      />
    </div>
  );
}
