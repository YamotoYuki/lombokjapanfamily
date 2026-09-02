import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GalleryFilters,
  GalleryGrid,
  GalleryTable,
} from '@/components/gallery';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useGallery,
  useHardDeleteGalleryItem,
  useUpdateGalleryItem,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';

export default function AdminGalleryPage() {
  const { t } = useTranslation();
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
  const deleteMutation = useHardDeleteGalleryItem();

  const items = galleryQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleDelete = async (item: (typeof items)[number]) => {
    if (!window.confirm(t('admin.pages.gallery.deleteConfirm'))) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteMutation.mutateAsync(item.id);
      setMessage(result.message ?? t('admin.pages.gallery.deleted'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.pages.gallery.deleteFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            {t('admin.titles.gallery')}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.pages.gallery.manageTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.gallery.description')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <LinkButton
            to="/admin/gallery/categories"
            variant="ghost"
            className="w-full sm:w-auto"
          >
            {t('admin.common.categoryManage')}
          </LinkButton>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            allowTable={allowTable}
          />
          <LinkButton to="/admin/gallery/new" className="w-full sm:w-auto">
            {t('admin.pages.gallery.addPhoto')}
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
                : t('admin.pages.gallery.fetchFailed')
              : message)}
        </div>
      )}

      {galleryQuery.isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
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
            onDelete={handleDelete}
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
                      ? t('admin.pages.gallery.shown')
                      : t('admin.pages.gallery.hid')),
                );
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : t('admin.common.networkError'),
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
                setMessage(result.message ?? t('admin.pages.gallery.saved'));
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : t('admin.common.networkError'),
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
