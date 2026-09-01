import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import { GalleryForm } from '@/components/gallery';
import {
  useGalleryItem,
  useHardDeleteGalleryItem,
  useUpdateGalleryItem,
  useUploadGalleryImage,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import type { GalleryItemInput } from '@/types/gallery';

export default function GalleryEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useGalleryItem(id);
  const categoriesQuery = useGalleryCategories();
  const updateMutation = useUpdateGalleryItem();
  const uploadMutation = useUploadGalleryImage();
  const deleteMutation = useHardDeleteGalleryItem();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  if (detailQuery.isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        {t('admin.pages.gallery.loading')}
      </p>
    );
  }

  if (detailQuery.isError || !detailQuery.data || detailQuery.data.id !== id) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.gallery.resource')}
        backTo="/admin/gallery"
        detail={
          detailQuery.error instanceof Error
            ? detailQuery.error.message
            : undefined
        }
      />
    );
  }

  const item = detailQuery.data;

  return (
    <AdminEditChrome
      eyebrow={t('admin.pages.gallery.editEyebrow')}
      title={item.title || t('admin.common.untitled')}
      subtitle={item.category?.name}
      backTo="/admin/gallery"
      message={message}
      error={error}
    >
      <GalleryForm
        dualSave
        initial={item}
        categories={categories}
        saving={updateMutation.isPending}
        uploading={uploadMutation.isPending}
        onUpload={async (file, categorySlug) => {
          const result = await uploadMutation.mutateAsync({
            file,
            categorySlug,
          });
          return result.payload.url;
        }}
        onSubmit={async (
          input: GalleryItemInput,
          meta?: { continueEditing?: boolean },
        ) => {
          setError(null);
          setMessage(null);
          try {
            const result = await updateMutation.mutateAsync({
              id: item.id,
              input,
            });
            if (meta?.continueEditing) {
              setMessage(result.message ?? t('admin.pages.gallery.saved'));
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/gallery', {
              replace: true,
              state: {
                message: result.message ?? t('admin.pages.gallery.saved'),
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.gallery.saveFailed'),
            );
          }
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.gallery.deleteDesc')}
        buttonLabel={t('admin.pages.gallery.deleteButton')}
        deleting={deleteMutation.isPending}
        onDelete={() => {
          if (!window.confirm(t('admin.pages.gallery.deleteConfirm'))) {
            return;
          }
          setError(null);
          void deleteMutation
            .mutateAsync(item.id)
            .then((result) => {
              navigate('/admin/gallery', {
                replace: true,
                state: {
                  message: result.message ?? t('admin.pages.gallery.deleted'),
                },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.gallery.deleteFailed'),
              );
            });
        }}
      />
    </AdminEditChrome>
  );
}
