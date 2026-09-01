import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import VideoForm from '@/components/videos/VideoForm';
import { useAuth } from '@/contexts/AuthContext';
import { useHideVideo, useUpdateVideo, useVideo } from '@/hooks/useVideos';
import type { VideoUpdatePayload } from '@/types/video';

export default function VideoEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const detailQuery = useVideo(id);
  const updateMutation = useUpdateVideo(session?.access_token);
  const hideMutation = useHideVideo(session?.access_token);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (detailQuery.isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        {t('admin.pages.videos.loading')}
      </p>
    );
  }

  if (detailQuery.isError || !detailQuery.data || detailQuery.data.id !== id) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.videos.resource')}
        backTo="/admin/videos"
        detail={
          detailQuery.error instanceof Error
            ? detailQuery.error.message
            : undefined
        }
      />
    );
  }

  const video = detailQuery.data;

  return (
    <AdminEditChrome
      eyebrow={t('admin.pages.videos.editEyebrow')}
      title={video.title}
      subtitle={video.category || undefined}
      backTo="/admin/videos"
      message={message}
      error={error}
    >
      <VideoForm
        key={video.id}
        dualSave
        video={video}
        saving={updateMutation.isPending}
        onSubmit={async (
          payload: VideoUpdatePayload,
          meta?: { continueEditing?: boolean },
        ) => {
          setError(null);
          setMessage(null);
          try {
            await updateMutation.mutateAsync({ id: video.id, payload });
            if (meta?.continueEditing) {
              setMessage(t('admin.pages.videos.saved'));
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/videos', {
              replace: true,
              state: { message: t('admin.pages.videos.saved') },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.videos.saveFailed'),
            );
          }
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.videos.unpublishDesc')}
        buttonLabel={t('admin.pages.videos.unpublishButton')}
        deleting={hideMutation.isPending}
        onDelete={() => {
          if (!window.confirm(t('admin.pages.videos.unpublishConfirm'))) return;
          setError(null);
          void hideMutation
            .mutateAsync(video.id)
            .then(() => {
              navigate('/admin/videos', {
                replace: true,
                state: { message: t('admin.pages.videos.unpublished') },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.videos.unpublishFailed'),
              );
            });
        }}
      />
    </AdminEditChrome>
  );
}
