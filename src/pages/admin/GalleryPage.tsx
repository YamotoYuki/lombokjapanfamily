import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GalleryFilters,
  GalleryGrid,
  GalleryTable,
} from '@/components/gallery';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useGallery,
  useUpdateGalleryItem,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';

export default function AdminGalleryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('card');
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
  const updateMutation = useUpdateGalleryItem();

  const items = galleryQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Gallery</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            ギャラリー管理
          </h2>
          <p className="mt-2 text-sm text-muted">
            一覧から専用編集ページへ移動して、写真・タイトル・カテゴリ・公開／注目を更新できます。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <LinkButton
            to="/admin/gallery/categories"
            variant="ghost"
            className="w-full sm:w-auto"
          >
            カテゴリー管理
          </LinkButton>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            allowTable={allowTable}
          />
          <LinkButton to="/admin/gallery/new" className="w-full sm:w-auto">
            写真を追加
          </LinkButton>
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

      {galleryQuery.isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : viewMode === 'card' ? (
        <GalleryGrid
          items={items}
          onSelect={(item) => navigate(`/admin/gallery/${item.id}/edit`)}
        />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <GalleryTable
            items={items}
            busyId={busyId}
            onEdit={(item) => navigate(`/admin/gallery/${item.id}/edit`)}
            onToggleVisibility={async (item) => {
              setBusyId(item.id);
              try {
                const nextVisible = !item.is_visible;
                const result = await updateMutation.mutateAsync({
                  id: item.id,
                  input: { is_visible: nextVisible },
                });
                setMessage(
                  result.message ??
                    (nextVisible
                      ? '写真を表示にしました'
                      : '写真を非表示にしました'),
                );
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
