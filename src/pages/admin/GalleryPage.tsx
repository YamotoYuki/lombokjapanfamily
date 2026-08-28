import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GalleryFilters,
  GalleryForm,
  GalleryGrid,
  GalleryTable,
} from '@/components/gallery';
import { Button, Card } from '@/components/ui';
import {
  useCreateGalleryItem,
  useGallery,
  useHideGalleryItem,
  useUpdateGalleryItem,
  useUploadGalleryImage,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import type { GalleryItem, GalleryItemInput } from '@/types/gallery';

export default function AdminGalleryPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      category: category || undefined,
      page: 1,
      limit: 48,
    }),
    [keyword, category],
  );

  const galleryQuery = useGallery(params);
  const categoriesQuery = useGalleryCategories();
  const createMutation = useCreateGalleryItem();
  const updateMutation = useUpdateGalleryItem();
  const hideMutation = useHideGalleryItem();
  const uploadMutation = useUploadGalleryImage();

  const items = galleryQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];

  const handleSave = async (input: GalleryItemInput) => {
    setError(null);
    setMessage(null);
    if (editing) {
      const result = await updateMutation.mutateAsync({
        id: editing.id,
        input,
      });
      setMessage(result.message ?? '写真を保存しました');
    } else {
      const result = await createMutation.mutateAsync(input);
      setMessage(result.message ?? '写真を保存しました');
    }
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Gallery</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">ギャラリー管理</h2>
          <p className="mt-2 text-sm text-muted">
            写真のアップロード・カテゴリー・おすすめ設定を管理します。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/gallery/categories"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-muted transition-colors hover:text-gold"
          >
            カテゴリー管理
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setViewMode((prev) => (prev === 'grid' ? 'table' : 'grid'))
            }
          >
            {viewMode === 'grid' ? 'テーブル表示' : 'グリッド表示'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            写真を追加
          </Button>
        </div>
      </div>

      <GalleryFilters
        keyword={keyword}
        category={category}
        categories={categories}
        onKeywordChange={setKeyword}
        onCategoryChange={setCategory}
      />

      {(message || error || galleryQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || galleryQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ||
            (galleryQuery.isError
              ? galleryQuery.error instanceof Error
                ? galleryQuery.error.message
                : '写真の取得に失敗しました'
              : message)}
        </div>
      )}

      {showForm && (
        <GalleryForm
          initial={editing}
          categories={categories}
          saving={createMutation.isPending || updateMutation.isPending}
          uploading={uploadMutation.isPending}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onUpload={async (file, categorySlug) => {
            const result = await uploadMutation.mutateAsync({
              file,
              categorySlug,
            });
            return result.payload.url;
          }}
          onSubmit={handleSave}
        />
      )}

      {galleryQuery.isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : viewMode === 'grid' ? (
        <GalleryGrid
          items={items}
          onSelect={(item) => {
            setEditing(item);
            setShowForm(true);
          }}
        />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <GalleryTable
            items={items}
            busyId={busyId}
            onEdit={(item) => {
              setEditing(item);
              setShowForm(true);
            }}
            onHide={async (item) => {
              setBusyId(item.id);
              try {
                const result = await hideMutation.mutateAsync(item.id);
                setMessage(result.message ?? '写真を非表示にしました');
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : '通信エラーが発生しました',
                );
              } finally {
                setBusyId(null);
              }
            }}
            onToggleFeatured={async (item) => {
              setBusyId(item.id);
              try {
                const result = await updateMutation.mutateAsync({
                  id: item.id,
                  input: { is_featured: !item.is_featured },
                });
                setMessage(result.message ?? '写真を保存しました');
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : '通信エラーが発生しました',
                );
              } finally {
                setBusyId(null);
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}
