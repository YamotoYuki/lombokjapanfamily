import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setMessage(t('admin.blog.categoryUpdated'));
      } else {
        await createMutation.mutateAsync({
          name,
          slug: slug || generatePostSlug(name),
          description,
        });
        setMessage(t('admin.blog.categoryCreated'));
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.common.categoryFetchFailed'),
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="space-y-4">
        <h3 className="font-semibold text-white">
          {editingId
            ? t('admin.common.categoryEdit')
            : t('admin.common.categoryAdd')}
        </h3>
        <Input
          label={t('admin.blog.name')}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!editingId) setSlug(generatePostSlug(event.target.value));
          }}
        />
        <Input
          label={t('admin.common.slug')}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
        <Input
          label={t('admin.common.description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="flex gap-2">
          <Button type="button" onClick={() => void handleSubmit()}>
            {editingId ? t('admin.common.update') : t('admin.blog.add')}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              {t('admin.common.cancel')}
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
          <p className="py-10 text-center text-sm text-muted">
            {t('admin.common.loading')}
          </p>
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
                    {t('admin.common.edit')}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-white"
                    onClick={() => {
                      void (async () => {
                        setError(null);
                        try {
                          await deleteMutation.mutateAsync(category.id);
                          setMessage(t('admin.common.categoryDeleted'));
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : t('admin.common.categoryFetchFailed'),
                          );
                        }
                      })();
                    }}
                  >
                    {t('admin.common.delete')}
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
