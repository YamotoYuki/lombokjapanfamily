import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import { NotificationBannerForm } from '@/components/notificationBanners';
import {
  useDeleteNotificationBanner,
  useNotificationBanner,
  useUpdateNotificationBanner,
} from '@/hooks/useNotificationBanners';
import {
  adminBannerTitle,
  type NotificationBannerInput,
} from '@/types/notificationBanner';

export default function NotificationBannerEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const bannerId = id?.trim() || '';
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useNotificationBanner(bannerId || undefined);
  const updateMutation = useUpdateNotificationBanner();
  const deleteMutation = useDeleteNotificationBanner();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [bannerId]);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  if (!bannerId || detailQuery.isLoading || detailQuery.isPending) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        {t('admin.pages.banners.loading')}
      </p>
    );
  }

  if (
    detailQuery.isError ||
    !detailQuery.data ||
    detailQuery.data.id !== bannerId
  ) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.banners.resource')}
        backTo="/admin/notification-banners"
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
      eyebrow={t('admin.pages.banners.editEyebrow')}
      title={adminBannerTitle(item) || t('admin.common.untitled')}
      backTo="/admin/notification-banners"
      message={message}
      error={error}
    >
      <NotificationBannerForm
        key={item.id}
        dualSave
        initial={item}
        saving={updateMutation.isPending}
        onSubmit={async (input: NotificationBannerInput, meta) => {
          setError(null);
          setMessage(null);
          try {
            const result = await updateMutation.mutateAsync({
              id: item.id,
              input,
            });
            if (meta?.continueEditing) {
              setMessage(result.message ?? t('admin.pages.banners.saved'));
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/notification-banners', {
              replace: true,
              state: {
                message: result.message ?? t('admin.pages.banners.saved'),
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.banners.saveFailed'),
            );
          }
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.banners.deleteDesc')}
        buttonLabel={t('admin.pages.banners.deleteButton')}
        deleting={deleteMutation.isPending}
        onDelete={() => {
          setError(null);
          deleteMutation.mutate(item.id, {
            onSuccess: () => {
              navigate('/admin/notification-banners', {
                replace: true,
                state: { message: t('admin.pages.banners.deleted') },
              });
            },
            onError: (err) =>
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.banners.deleteFailed'),
              ),
          });
        }}
      />
    </AdminEditChrome>
  );
}
