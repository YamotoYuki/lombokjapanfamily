import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

interface LogoUploaderProps {
  label?: string;
  hint?: string;
  previewUrl?: string | null;
  accept?: string;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
}

export default function LogoUploader({
  label,
  hint,
  previewUrl,
  accept = 'image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico',
  uploading,
  onUpload,
}: LogoUploaderProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('admin.settings.imageDefault');
  const resolvedHint = hint ?? t('admin.settings.imageHintDefault');
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setLocalError(null);
    try {
      await onUpload(file);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : t('admin.common.uploadFailed'),
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{resolvedLabel}</p>
          <p className="mt-1 text-xs text-muted/80">{resolvedHint}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />}
          {t('admin.common.upload')}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-primary-bg/40 p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={resolvedLabel}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <p className="text-sm text-muted">{t('admin.common.unset')}</p>
        )}
      </div>
      {localError && <p className="text-xs text-red-400">{localError}</p>}
    </div>
  );
}
