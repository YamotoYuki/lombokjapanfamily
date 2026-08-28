import { useState } from 'react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  useCreateGalleryCategory,
  useDeleteGalleryCategory,
  useGalleryCategories,
  useUpdateGalleryCategory,
} from '@/hooks/useGalleryCategories';
import type { GalleryCategory } from '@/types/gallery';

export default function GalleryCategoryManager() {
  const categoriesQuery = useGalleryCategories();
  const createMutation = useCreateGalleryCategory();
  const updateMutation = useUpdateGalleryCategory();
  const deleteMutation = useDeleteGalleryCategory();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<GalleryCategory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setEditing(null);
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    try {
      if (editing) {
        const result = await updateMutation.mutateAsync({
          id: editing.id,
          input: {
            name,
            slug: slug || undefined,
            description: description || undefined,
            display_order: editing.display_order,
          },
        });
        setMessage(result.message ?? 'カテゴリーを保存しました');
      } else {
        const result = await createMutation.mutateAsync({
          name,
          slug: slug || undefined,
          description: description || undefined,
        });
        setMessage(result.message ?? 'カテゴリーを保存しました');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          {editing ? 'カテゴリー編集' : 'カテゴリー追加'}
        </h3>
        <Input
          label="カテゴリー名"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="スラッグ"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="自動生成可"
        />
        <Textarea
          label="説明"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
        {(message || error) && (
          <div
            className={[
              'rounded-2xl border px-4 py-3 text-sm',
              error
                ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
                : 'border-success/30 bg-success/10 text-success',
            ].join(' ')}
          >
            {error ?? message}
          </div>
        )}
        <div className="flex gap-2">
          <Button type="button" onClick={() => void handleSave()}>
            保存する
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              キャンセル
            </Button>
          )}
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold text-white">カテゴリー一覧</h3>
        {categoriesQuery.isLoading && (
          <p className="text-sm text-muted">読み込み中...</p>
        )}
        {categoriesQuery.isError && (
          <p className="text-sm text-red-300">
            {categoriesQuery.error instanceof Error
              ? categoriesQuery.error.message
              : 'カテゴリーの取得に失敗しました'}
          </p>
        )}
        <div className="space-y-2">
          {(categoriesQuery.data ?? []).map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-primary-bg/40 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{category.name}</p>
                <p className="text-xs text-muted">
                  {category.slug} / 表示順 {category.display_order}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                    setSlug(category.slug);
                    setDescription(category.description ?? '');
                  }}
                >
                  編集
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    setError(null);
                    try {
                      await deleteMutation.mutateAsync(category.id);
                      setMessage('カテゴリーを削除しました');
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : '通信エラーが発生しました',
                      );
                    }
                  }}
                >
                  削除
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: category.id,
                        input: {
                          display_order: Math.max(0, category.display_order - 1),
                        },
                      });
                      setMessage('表示順を更新しました');
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : '通信エラーが発生しました',
                      );
                    }
                  }}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: category.id,
                        input: { display_order: category.display_order + 1 },
                      });
                      setMessage('表示順を更新しました');
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : '通信エラーが発生しました',
                      );
                    }
                  }}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
