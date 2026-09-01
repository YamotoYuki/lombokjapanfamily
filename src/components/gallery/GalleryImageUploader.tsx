import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_BYTES = 5 * 1024 * 1024;

interface GalleryImageUploaderProps {
  previewUrl?: string;
  uploading?: boolean;
  onUploaded: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export default function GalleryImageUploader({
  previewUrl,
  uploading,
  onUploaded,
  onUpload,
}: GalleryImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (file: File | undefined) => {
    setError(null);
    if (!file) {
      setError(t('admin.common.selectImage'));
      return;
    }
    if (!ALLOWED.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError(t('admin.common.unsupportedFile'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('admin.common.imageTooLarge'));
      return;
    }
    try {
      const url = await onUpload(file);
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.common.imageUploadFailed'),
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('admin.gallery.previewAlt')}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center text-sm text-muted">
            {t('admin.gallery.imagePreview')}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} />
        {uploading
          ? t('admin.common.uploading')
          : t('admin.common.uploadImage')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleChange(event.target.files?.[0])}
      />
      <p className="text-xs text-muted">{t('admin.gallery.fileHint')}</p>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
