import { useRef, useState } from 'react';
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
        err instanceof Error ? err.message : '画像アップロードに失敗しました',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted">アイキャッチ画像</p>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img
            src={value}
            alt="featured"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-muted">
          画像未設定
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
        {uploading ? 'アップロード中...' : '画像をアップロード'}
      </Button>
      {error && <p className="text-xs text-youtube-red">{error}</p>}
      <p className="text-xs text-muted">jpg / png / webp ・ 5MB以下</p>
    </div>
  );
}
