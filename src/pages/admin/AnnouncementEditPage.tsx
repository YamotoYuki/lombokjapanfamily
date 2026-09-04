import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        {t('admin.pages.announcements.loading')}
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
        resourceLabel={t('admin.pages.announcements.resource')}
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
    setError(null);
    void deleteMutation
      .mutateAsync({ id: item.id, hard: true })
      .then((result) => {
        navigate('/admin/announcements', {
          replace: true,
          state: {
            message: result.message ?? t('admin.pages.announcements.deleted'),
          },
        });
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : t('admin.pages.announcements.deleteFailed'),
        );
      });
  };

  return (
    <AdminEditChrome
      key={item.id}
      eyebrow={t('admin.pages.announcements.editEyebrow')}
      title={adminAnnouncementTitle(item) || t('admin.common.untitled')}
      subtitle={item.category}
      backTo="/admin/announcements"
      backLabel={t('admin.pages.announcements.back')}
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
              setMessage(
                result.message ?? t('admin.pages.announcements.saved'),
              );
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/announcements', {
              replace: true,
              state: {
                message:
                  result.message ?? t('admin.pages.announcements.saved'),
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.announcements.saveFailed'),
            );
          }
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.announcements.deleteDesc')}
        buttonLabel={t('admin.pages.announcements.deleteButton')}
        deleting={deleteMutation.isPending}
        onDelete={handleDelete}
      />
    </AdminEditChrome>
  );
}
