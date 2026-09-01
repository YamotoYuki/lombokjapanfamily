import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { GalleryForm } from '@/components/gallery';
import {
  useCreateGalleryItem,
  useUploadGalleryImage,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import type { GalleryItemInput } from '@/types/gallery';

export default function GalleryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const categoriesQuery = useGalleryCategories();
  const createMutation = useCreateGalleryItem();
  const uploadMutation = useUploadGalleryImage();
  const [error, setError] = useState<string | null>(null);
  const categories = categoriesQuery.data ?? [];

  return (
    <AdminEditChrome
      eyebrow={t('admin.titles.gallery')}
      title={t('admin.pages.gallery.createEyebrow')}
      backTo="/admin/gallery"
      error={error}
    >
      <GalleryForm
        dualSave
        categories={categories}
        saving={createMutation.isPending}
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
          try {
            const result = await createMutation.mutateAsync(input);
            if (meta?.continueEditing && result.payload?.id) {
              navigate(`/admin/gallery/${result.payload.id}/edit`, {
                replace: true,
                state: {
                  message: result.message ?? t('admin.pages.gallery.saved'),
                },
              });
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
    </AdminEditChrome>
  );
}
