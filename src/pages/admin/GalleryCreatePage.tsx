import { useState } from 'react';
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
  const navigate = useNavigate();
  const categoriesQuery = useGalleryCategories();
  const createMutation = useCreateGalleryItem();
  const uploadMutation = useUploadGalleryImage();
  const [error, setError] = useState<string | null>(null);
  const categories = categoriesQuery.data ?? [];

  return (
    <AdminEditChrome
      eyebrow="Gallery"
      title="Gallery新規作成"
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
                state: { message: result.message ?? '写真を保存しました' },
              });
              return;
            }
            navigate('/admin/gallery', {
              replace: true,
              state: { message: result.message ?? '写真を保存しました' },
            });
          } catch (err) {
            setError(
              err instanceof Error ? err.message : '写真の保存に失敗しました',
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
