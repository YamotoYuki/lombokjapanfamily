import { useEffect, useState } from 'react';
import FamilyImageUploader from '@/components/family/FamilyImageUploader';
import FamilySocialFields from '@/components/family/FamilySocialFields';
import { Button, Card, Input, Textarea } from '@/components/ui';
import type { FamilyProfile, FamilyProfileInput } from '@/types/family';

interface FamilyFormProps {
  initial?: FamilyProfile | null;
  saving?: boolean;
  uploading?: boolean;
  onSubmit: (input: FamilyProfileInput) => Promise<void>;
  onUploadPhoto?: (file: File) => Promise<string | void>;
  onCancel?: () => void;
}

const empty: FamilyProfileInput = {
  name: '',
  role: '',
  description: '',
  photo_url: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_url: '',
  x_url: '',
  display_order: 0,
  is_visible: true,
};

export default function FamilyForm({
  initial,
  saving,
  uploading,
  onSubmit,
  onUploadPhoto,
  onCancel,
}: FamilyFormProps) {
  const [form, setForm] = useState<FamilyProfileInput>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      return;
    }
    setForm({
      name: initial.name,
      role: initial.role ?? '',
      description: initial.description ?? '',
      photo_url: initial.photo_url ?? '',
      instagram_url: initial.instagram_url ?? '',
      tiktok_url: initial.tiktok_url ?? '',
      youtube_url: initial.youtube_url ?? '',
      x_url: initial.x_url ?? '',
      display_order: initial.display_order,
      is_visible: initial.is_visible,
    });
  }, [initial]);

  const setField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('名前を入力してください');
      return;
    }
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        role: form.role?.trim() || undefined,
        description: form.description?.trim() || undefined,
        photo_url: form.photo_url || undefined,
        instagram_url: form.instagram_url || undefined,
        tiktok_url: form.tiktok_url || undefined,
        youtube_url: form.youtube_url || undefined,
        x_url: form.x_url || undefined,
        display_order: Number(form.display_order ?? 0),
        is_visible: Boolean(form.is_visible),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '家族プロフィールの保存に失敗しました',
      );
    }
  };

  return (
    <Card>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">
            {initial ? 'プロフィール編集' : '新規プロフィール'}
          </h3>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              閉じる
            </Button>
          )}
        </div>

        <FamilyImageUploader
          previewUrl={form.photo_url}
          uploading={uploading}
          onSelect={async (file) => {
            if (onUploadPhoto) {
              const url = await onUploadPhoto(file);
              if (url) setField('photo_url', url);
              return;
            }
            const objectUrl = URL.createObjectURL(file);
            setField('photo_url', objectUrl);
          }}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="名前 *"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
          />
          <Input
            label="役割"
            value={form.role ?? ''}
            onChange={(event) => setField('role', event.target.value)}
            placeholder="例: Father / Mother"
          />
        </div>

        <Textarea
          label="紹介文"
          value={form.description ?? ''}
          onChange={(event) => setField('description', event.target.value)}
          rows={4}
        />

        <FamilySocialFields
          values={form}
          onChange={(field, value) => setField(field, value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="表示順"
            type="number"
            value={String(form.display_order ?? 0)}
            onChange={(event) =>
              setField('display_order', Number(event.target.value || 0))
            }
          />
          <label className="flex items-end gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={Boolean(form.is_visible)}
              onChange={(event) => setField('is_visible', event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-primary-bg"
            />
            公開する
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存する'}
        </Button>
      </form>
    </Card>
  );
}
