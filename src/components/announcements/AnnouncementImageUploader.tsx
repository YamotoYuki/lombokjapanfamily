import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
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
        err instanceof Error ? err.message : '画像アップロードに失敗しました',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted">アイキャッチ画像</p>
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
          画像未設定
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
          {uploading ? 'アップロード中...' : '画像をアップロード'}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => onChange('')}
          >
            <Trash2 size={16} />
            画像を削除
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-youtube-red">{error}</p> : null}
      <p className="text-xs text-muted">jpg / png / webp ・ 5MB以下</p>
    </div>
  );
}
