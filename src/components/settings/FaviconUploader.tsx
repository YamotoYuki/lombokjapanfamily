import { useTranslation } from 'react-i18next';
import LogoUploader from './LogoUploader';

interface FaviconUploaderProps {
  previewUrl?: string | null;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
}

export default function FaviconUploader({
  previewUrl,
  uploading,
  onUpload,
}: FaviconUploaderProps) {
  const { t } = useTranslation();
  return (
    <LogoUploader
      label={t('admin.settings.favicon')}
      hint={t('admin.settings.faviconHint')}
      previewUrl={previewUrl}
      uploading={uploading}
      onUpload={onUpload}
      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
    />
  );
}
