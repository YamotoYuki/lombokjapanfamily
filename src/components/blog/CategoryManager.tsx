import { useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  useCreatePostCategory,
  useDeletePostCategory,
  usePostCategories,
  useUpdatePostCategory,
} from '@/hooks/usePostCategories';
import { generatePostSlug } from '@/types/post';

interface CategoryManagerProps {
  accessToken?: string | null;
}

export default function CategoryManager({ accessToken }: CategoryManagerProps) {
  const categoriesQuery = usePostCategories();
  const createMutation = useCreatePostCategory(accessToken);
  const updateMutation = useUpdatePostCategory(accessToken);
  const deleteMutation = useDeletePostCategory(accessToken);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          input: { name, slug, description },
        });
        setMessage('カテゴリーを更新しました');
      } else {
        await createMutation.mutateAsync({
          name,
          slug: slug || generatePostSlug(name),
          description,
        });
        setMessage('カテゴリーを作成しました');
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'カテゴリーの取得に失敗しました',
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="space-y-4">
        <h3 className="font-semibold text-white">
          {editingId ? 'カテゴリー編集' : 'カテゴリー追加'}
        </h3>
        <Input
          label="名前"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!editingId) setSlug(generatePostSlug(event.target.value));
          }}
        />
        <Input
          label="スラッグ"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
        <Input
          label="説明"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="flex gap-2">
          <Button type="button" onClick={() => void handleSubmit()}>
            {editingId ? '更新' : '追加'}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              キャンセル
            </Button>
          )}
        </div>
        {(message || error) && (
          <p
            className={[
              'text-sm',
              error ? 'text-youtube-red' : 'text-success',
            ].join(' ')}
          >
            {error ?? message}
          </p>
        )}
      </Card>

      <Card>
        {categoriesQuery.isLoading ? (
          <p className="py-10 text-center text-sm text-muted">読み込み中...</p>
        ) : (
          <div className="space-y-3">
            {(categoriesQuery.data ?? []).map((category) => (
              <div
                key={category.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-primary-bg/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{category.name}</p>
                  <p className="text-xs text-muted">/{category.slug}</p>
                  {category.description && (
                    <p className="mt-1 text-xs text-muted">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-gold"
                    onClick={() => {
                      setEditingId(category.id);
                      setName(category.name);
                      setSlug(category.slug);
                      setDescription(category.description ?? '');
                    }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-white"
                    onClick={() => {
                      void (async () => {
                        setError(null);
                        try {
                          await deleteMutation.mutateAsync(category.id);
                          setMessage('カテゴリーを削除しました');
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : 'カテゴリーの取得に失敗しました',
                          );
                        }
                      })();
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
