import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import { AnnouncementForm } from '@/components/announcements';
import {
  useAnnouncement,
  useUpdateAnnouncement,
} from '@/hooks/useAnnouncements';
import type { AnnouncementInput } from '@/types/announcement';
import { adminAnnouncementTitle } from '@/types/announcement';

export default function AnnouncementEditPage() {
  const { id } = useParams<{ id: string }>();
  const announcementId = id?.trim() || '';
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useAnnouncement(announcementId || undefined);
  const updateMutation = useUpdateAnnouncement();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [announcementId]);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  if (!announcementId || detailQuery.isLoading || detailQuery.isPending) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        お知らせを読み込んでいます...
      </p>
    );
  }

  if (
    detailQuery.isError ||
    !detailQuery.data ||
    detailQuery.data.id !== announcementId
  ) {
    return (
      <AdminResourceNotFound
        resourceLabel="お知らせ"
        backTo="/admin/announcements"
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
      key={item.id}
      eyebrow="Announcements編集"
      title={adminAnnouncementTitle(item) || '（無題）'}
      subtitle={item.category}
      backTo="/admin/announcements"
      backLabel="お知らせ一覧へ戻る"
      message={message}
      error={error}
    >
      <AnnouncementForm
        key={item.id}
        dualSave
        initial={item}
        saving={updateMutation.isPending}
        onSubmit={async (input: AnnouncementInput, meta) => {
          setError(null);
          setMessage(null);
          try {
            const result = await updateMutation.mutateAsync({
              id: item.id,
              input,
            });
            if (meta?.continueEditing) {
              setMessage(result.message ?? 'お知らせを保存しました');
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/announcements', {
              replace: true,
              state: {
                message: result.message ?? 'お知らせを保存しました',
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'お知らせの保存に失敗しました',
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
