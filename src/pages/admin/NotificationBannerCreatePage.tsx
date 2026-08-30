import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { NotificationBannerForm } from '@/components/notificationBanners';
import { useCreateNotificationBanner } from '@/hooks/useNotificationBanners';
import type { NotificationBannerInput } from '@/types/notificationBanner';

export default function NotificationBannerCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateNotificationBanner();
  const [error, setError] = useState<string | null>(null);

  return (
    <AdminEditChrome
      eyebrow="Notification Banner"
      title="通知バナー新規作成"
      backTo="/admin/notification-banners"
      backLabel="一覧へ戻る"
      error={error}
    >
      <NotificationBannerForm
        dualSave
        saving={createMutation.isPending}
        onSubmit={async (input: NotificationBannerInput, meta) => {
          setError(null);
          try {
            const result = await createMutation.mutateAsync(input);
            if (meta?.continueEditing && result.payload?.id) {
              navigate(
                `/admin/notification-banners/${result.payload.id}/edit`,
                {
                  replace: true,
                  state: {
                    message: result.message ?? '通知バナーを保存しました',
                  },
                },
              );
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
    </AdminEditChrome>
  );
}
