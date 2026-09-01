import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { uploadAnnouncementImage } from '@/services/announcementApi';

interface AnnouncementImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function AnnouncementImageUploader({
  value,
  onChange,
}: AnnouncementImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadAnnouncementImage(file);
      onChange(result.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.common.imageUploadFailed'),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted">
        {t('admin.announcements.featuredImage')}
      </p>
      {value ? (
        <div className="flex h-28 w-full max-w-[14rem] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:h-32">
          <img
            src={value}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-16 w-full max-w-[12rem] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-muted">
          {t('admin.common.imageUnset')}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          {uploading ? t('admin.common.uploading') : t('admin.common.uploadImage')}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => onChange('')}
          >
            <Trash2 size={16} />
            {t('admin.common.removeImage')}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-youtube-red">{error}</p> : null}
      <p className="text-xs text-muted">{t('admin.common.imageHint')}</p>
    </div>
  );
}
