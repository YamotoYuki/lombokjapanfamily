import { useEffect, useState } from 'react';
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
        通知バナーを読み込んでいます...
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
        resourceLabel="通知バナー"
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
      eyebrow="Notification Banner編集"
      title={adminBannerTitle(item) || '（無題）'}
      backTo="/admin/notification-banners"
      backLabel="一覧へ戻る"
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
              setMessage(result.message ?? '通知バナーを保存しました');
              await detailQuery.refetch();
              return;
            }
            navigate('/admin/notification-banners', {
              replace: true,
              state: {
                message: result.message ?? '通知バナーを保存しました',
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : '通知バナーの保存に失敗しました',
            );
          }
        }}
      />
      <AdminDangerZone
        description="この通知バナーを削除します。トップページからも消えます。"
        buttonLabel="通知バナーを削除"
        deleting={deleteMutation.isPending}
        onDelete={() => {
          if (!window.confirm('この通知バナーを削除しますか？')) return;
          setError(null);
          deleteMutation.mutate(item.id, {
            onSuccess: () => {
              navigate('/admin/notification-banners', {
                replace: true,
                state: { message: '通知バナーを削除しました' },
              });
            },
            onError: (err) =>
              setError(
                err instanceof Error
                  ? err.message
                  : '通知バナーの削除に失敗しました',
              ),
          });
        }}
      />
    </AdminEditChrome>
  );
}
