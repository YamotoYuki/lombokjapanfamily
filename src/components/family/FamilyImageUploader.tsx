import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_BYTES = 5 * 1024 * 1024;

interface FamilyImageUploaderProps {
  previewUrl?: string;
  uploading?: boolean;
  onSelect: (file: File) => Promise<void> | void;
}

export default function FamilyImageUploader({
  previewUrl,
  uploading,
  onSelect,
}: FamilyImageUploaderProps) {
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
      await onSelect(file);
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
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/60">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t('admin.family.photoAlt')}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted">
              {t('admin.family.noImage')}
            </div>
          )}
        </div>
        <div>
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
              : t('admin.family.selectPhoto')}
          </Button>
          <p className="mt-2 text-xs text-muted">
            {t('admin.family.fileHint')}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleChange(event.target.files?.[0])}
      />
      {error && (
        <p className="text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
