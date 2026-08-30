import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import VideoForm from '@/components/videos/VideoForm';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateVideo, useVideo } from '@/hooks/useVideos';
import type { VideoUpdatePayload } from '@/types/video';

export default function VideoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const detailQuery = useVideo(id);
  const updateMutation = useUpdateVideo(session?.access_token);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (detailQuery.isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        動画を読み込んでいます...
      </p>
    );
  }

  if (detailQuery.isError || !detailQuery.data || detailQuery.data.id !== id) {
    return (
      <AdminResourceNotFound
        resourceLabel="動画"
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
      eyebrow="Videos編集"
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
              setMessage('動画設定を保存しました');
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/videos', {
              replace: true,
              state: { message: '動画設定を保存しました' },
            });
          } catch (err) {
            setError(
              err instanceof Error ? err.message : '動画の保存に失敗しました',
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
