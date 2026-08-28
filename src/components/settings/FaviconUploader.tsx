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
  return (
    <LogoUploader
      label="ファビコン"
      hint="ico / png / svg / webp（推奨 32×32 または 64×64）"
      previewUrl={previewUrl}
      uploading={uploading}
      onUpload={onUpload}
      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
    />
  );
}
