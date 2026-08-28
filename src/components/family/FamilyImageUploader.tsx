import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
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
      await onSelect(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '画像のアップロードに失敗しました',
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
              alt="プロフィール画像"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted">
              No Image
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
            {uploading ? 'アップロード中...' : '画像を選択'}
          </Button>
          <p className="mt-2 text-xs text-muted">jpg / png / webp ・ 5MB以下</p>
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
