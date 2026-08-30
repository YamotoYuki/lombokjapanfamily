import { useEffect, useState } from 'react';
import { AdminStickyActions } from '@/components/admin';
import GalleryImageUploader from '@/components/gallery/GalleryImageUploader';
import { Button, Card, Input, Textarea } from '@/components/ui';
import type {
  GalleryCategory,
  GalleryItem,
  GalleryItemInput,
} from '@/types/gallery';

interface GalleryFormProps {
  initial?: GalleryItem | null;
  categories: GalleryCategory[];
  saving?: boolean;
  uploading?: boolean;
  dualSave?: boolean;
  onUpload: (file: File, categorySlug?: string) => Promise<string>;
  onSubmit: (
    input: GalleryItemInput,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
  onCancel?: () => void;
}

const empty: GalleryItemInput = {
  title: '',
  description: '',
  image_url: '',
  thumbnail_url: '',
  category_id: '',
  location: '',
  taken_at: '',
  display_order: 0,
  is_featured: false,
  is_visible: true,
};

export default function GalleryForm({
  initial,
  categories,
  saving,
  uploading,
  dualSave = false,
  onUpload,
  onSubmit,
  onCancel,
}: GalleryFormProps) {
  const [form, setForm] = useState<GalleryItemInput>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      return;
    }
    setForm({
      title: initial.title ?? '',
      description: initial.description ?? '',
      image_url: initial.image_url ?? '',
      thumbnail_url: initial.thumbnail_url ?? initial.image_url ?? '',
      category_id: initial.category_id ?? '',
      location: initial.location ?? '',
      taken_at: initial.taken_at ?? '',
      display_order: initial.display_order ?? 0,
      is_featured: initial.is_featured,
      is_visible: initial.is_visible,
    });
  }, [initial]);

  const setField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedSlug = categories.find((c) => c.id === form.category_id)?.slug;

  const handleSubmit = async (event: React.FormEvent, stay = false) => {
    event.preventDefault();
    setError(null);
    if (!form.image_url) {
      setError('画像を選択してください');
      return;
    }
    try {
      await onSubmit(
        {
          ...form,
          title: form.title?.trim() || undefined,
          description: form.description?.trim() || undefined,
          category_id: form.category_id || undefined,
          location: form.location?.trim() || undefined,
          taken_at: form.taken_at || undefined,
          thumbnail_url: form.thumbnail_url || form.image_url,
          display_order: Number(form.display_order ?? 0),
          is_featured: Boolean(form.is_featured),
          is_visible: Boolean(form.is_visible),
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '写真の保存に失敗しました');
    }
  };

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event, false)}
      >        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">
            {initial ? '写真を編集' : '写真を追加'}
          </h3>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              閉じる
            </Button>
          )}
        </div>

        <GalleryImageUploader
          previewUrl={form.image_url}
          uploading={uploading}
          onUploaded={(url) => {
            setField('image_url', url);
            setField('thumbnail_url', url);
          }}
          onUpload={async (file) => onUpload(file, selectedSlug)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="タイトル"
            value={form.title ?? ''}
            onChange={(event) => setField('title', event.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm text-muted">カテゴリー</label>
            <select
              value={form.category_id ?? ''}
              onChange={(event) => setField('category_id', event.target.value)}
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">未設定</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="説明"
          value={form.description ?? ''}
          onChange={(event) => setField('description', event.target.value)}
          rows={3}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="場所"
            value={form.location ?? ''}
            onChange={(event) => setField('location', event.target.value)}
          />
          <Input
            label="撮影日"
            type="date"
            value={form.taken_at ?? ''}
            onChange={(event) => setField('taken_at', event.target.value)}
          />
          <Input
            label="表示順"
            type="number"
            value={String(form.display_order ?? 0)}
            onChange={(event) =>
              setField('display_order', Number(event.target.value || 0))
            }
          />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.is_featured)}
              onChange={(event) => setField('is_featured', event.target.checked)}
            />
            おすすめに設定
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.is_visible)}
              onChange={(event) => setField('is_visible', event.target.checked)}
            />
            公開する
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <AdminStickyActions>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving
              ? '保存中...'
              : dualSave
                ? '保存して一覧へ戻る'
                : '保存する'}
          </Button>
          {dualSave ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={(event) => void handleSubmit(event, true)}
            >
              保存して編集を続ける
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          ) : null}
        </AdminStickyActions>
      </form>
    </Card>
  );
}
