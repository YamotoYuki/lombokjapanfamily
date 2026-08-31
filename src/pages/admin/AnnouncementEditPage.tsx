import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import { AnnouncementForm } from '@/components/announcements';
import {
  useAnnouncement,
  useDeleteAnnouncement,
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
  const deleteMutation = useDeleteAnnouncement();
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

  const handleDelete = () => {
    if (
      !window.confirm(
        'このお知らせを完全に削除しますか？この操作は取り消せません。',
      )
    ) {
      return;
    }
    setError(null);
    void deleteMutation
      .mutateAsync({ id: item.id, hard: true })
      .then((result) => {
        navigate('/admin/announcements', {
          replace: true,
          state: { message: result.message ?? 'お知らせを削除しました' },
        });
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'お知らせの削除に失敗しました',
        );
      });
  };

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
      <AdminDangerZone
        description="このお知らせを完全に削除します。公開サイトからも消えます。"
        buttonLabel="お知らせを削除"
        deleting={deleteMutation.isPending}
        onDelete={handleDelete}
      />
    </AdminEditChrome>
  );
}
