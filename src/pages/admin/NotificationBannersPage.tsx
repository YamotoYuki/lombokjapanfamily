import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  NotificationBannerTable,
} from '@/components/notificationBanners';
import { Button } from '@/components/ui';
import {
  useDeleteNotificationBanner,
  useNotificationBanners,
} from '@/hooks/useNotificationBanners';

export default function AdminNotificationBannersPage() {
  const location = useLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useNotificationBanners();
  const deleteMutation = useDeleteNotificationBanner();

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  const items = listQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Notification Banner
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            TOP通知バナー
          </h2>
          <p className="mt-1 text-sm text-muted">
            トップページ Hero 直下に表示する通知を管理します。
          </p>
        </div>
        <Link to="/admin/notification-banners/new">
          <Button type="button">
            <Plus size={16} />
            新規作成
          </Button>
        </Link>
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
        <p className="py-12 text-center text-sm text-muted">読み込み中...</p>
      ) : (
        <NotificationBannerTable
          items={items}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
          onDelete={(id) => {
            if (!window.confirm('この通知バナーを削除しますか？')) return;
            setError(null);
            deleteMutation.mutate(id, {
              onSuccess: () => setMessage('通知バナーを削除しました'),
              onError: (err) =>
                setError(
                  err instanceof Error
                    ? err.message
                    : '通知バナーの削除に失敗しました',
                ),
            });
          }}
        />
      )}
    </div>
  );
}
