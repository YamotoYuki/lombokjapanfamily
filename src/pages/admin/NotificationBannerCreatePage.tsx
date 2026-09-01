import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { NotificationBannerForm } from '@/components/notificationBanners';
import { useCreateNotificationBanner } from '@/hooks/useNotificationBanners';
import type { NotificationBannerInput } from '@/types/notificationBanner';

export default function NotificationBannerCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateNotificationBanner();
  const [error, setError] = useState<string | null>(null);

  return (
    <AdminEditChrome
      eyebrow={t('admin.titles.notificationBanners')}
      title={t('admin.pages.banners.createEyebrow')}
      backTo="/admin/notification-banners"
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
                    message: result.message ?? t('admin.pages.banners.saved'),
                  },
                },
              );
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
    </AdminEditChrome>
  );
}
