import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  NotificationBannerTable,
} from '@/components/notificationBanners';
import { Card, LinkButton } from '@/components/ui';
import {
  useDeleteNotificationBanner,
  useNotificationBanners,
} from '@/hooks/useNotificationBanners';

export default function AdminNotificationBannersPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useNotificationBanners();
  const deleteMutation = useDeleteNotificationBanner();

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const items = listQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Notification Banner
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.pages.banners.manageTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('admin.pages.banners.description')}
          </p>
        </div>
        <LinkButton to="/admin/notification-banners/new">
          <Plus size={16} />
          {t('admin.common.create')}
        </LinkButton>
      </div>

      {(message || error) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ?? message}
        </div>
      )}

      {listQuery.isLoading ? (
        <p className="py-12 text-center text-sm text-muted">
          {t('admin.common.loading')}
        </p>
      ) : listQuery.isError ? (
        <Card className="px-4 py-10 text-center text-sm text-red-300">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : t('admin.pages.banners.fetchFailed')}
        </Card>
      ) : (
        <NotificationBannerTable
          items={items}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
          onDelete={(id) => {
            if (!window.confirm(t('admin.pages.banners.deleteConfirm'))) return;
            setError(null);
            deleteMutation.mutate(id, {
              onSuccess: () => setMessage(t('admin.pages.banners.deleted')),
              onError: (err) =>
                setError(
                  err instanceof Error
                    ? err.message
                    : t('admin.pages.banners.deleteFailed'),
                ),
            });
          }}
        />
      )}
    </div>
  );
}
