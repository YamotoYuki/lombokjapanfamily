import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (file: File | undefined) => {
    setError(null);
    if (!file) {
      setError('画像を選択してください');
      return;
    }
    if (!ALLOWED.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError('対応していないファイル形式です');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('画像サイズが大きすぎます');
      return;
    }
    try {
      const url = await onUpload(file);
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '画像のアップロードに失敗しました',
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="プレビュー"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center text-sm text-muted">
            画像プレビュー
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
        {uploading ? 'アップロード中...' : '画像をアップロード'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleChange(event.target.files?.[0])}
      />
      <p className="text-xs text-muted">jpg / png / webp ・ 5MB以下</p>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
