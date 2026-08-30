import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import { GalleryForm } from '@/components/gallery';
import {
  useGalleryItem,
  useUpdateGalleryItem,
  useUploadGalleryImage,
} from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import type { GalleryItemInput } from '@/types/gallery';

export default function GalleryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useGalleryItem(id);
  const categoriesQuery = useGalleryCategories();
  const updateMutation = useUpdateGalleryItem();
  const uploadMutation = useUploadGalleryImage();
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
        写真を読み込んでいます...
      </p>
    );
  }

  if (detailQuery.isError || !detailQuery.data || detailQuery.data.id !== id) {
    return (
      <AdminResourceNotFound
        resourceLabel="Gallery写真"
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
      eyebrow="Gallery編集"
      title={item.title || '（無題）'}
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
              setMessage(result.message ?? '写真を保存しました');
              await detailQuery.refetch();
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
