import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { uploadPostImage } from '@/services/postApi';

interface BlogImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  accessToken?: string | null;
}

export default function BlogImageUploader({
  value,
  onChange,
  accessToken,
}: BlogImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadPostImage(file, 'featured', accessToken);
      onChange(result.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.common.imageUploadFailed'),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted">
        {t('admin.blog.featuredImage')}
      </p>
      {value ? (
        <div className="flex max-h-56 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-3">
          <img
            src={value}
            alt="featured"
            className="max-h-52 w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex max-h-40 min-h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-sm text-muted">
          {t('admin.common.imageUnset')}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
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
      {error && <p className="text-xs text-youtube-red">{error}</p>}
      <p className="text-xs text-muted">{t('admin.blog.imageHint')}</p>
    </div>
  );
}
