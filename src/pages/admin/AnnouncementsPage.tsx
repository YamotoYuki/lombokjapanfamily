import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  AnnouncementTable,
} from '@/components/announcements';
import { Button, Card } from '@/components/ui';
import {
  useAnnouncementStats,
  useAnnouncements,
  useDeleteAnnouncement,
} from '@/hooks/useAnnouncements';

export default function AdminAnnouncementsPage() {
  const location = useLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useAnnouncements({ page: 1, limit: 100 });
  const statsQuery = useAnnouncementStats();
  const deleteMutation = useDeleteAnnouncement();

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  const items = listQuery.data?.items ?? [];
  const stats = statsQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Announcements
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            お知らせ管理
          </h2>
          <p className="mt-1 text-sm text-muted">
            動画公開やサイト更新のお知らせを管理します。
          </p>
        </div>
        <Link to="/admin/announcements/new">
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="px-4 py-4">
          <p className="text-xs text-muted">合計</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats?.total ?? '—'}
          </p>
        </Card>
        <Card className="px-4 py-4">
          <p className="text-xs text-muted">公開中</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats?.published_count ?? '—'}
          </p>
        </Card>
        <Card className="px-4 py-4">
          <p className="text-xs text-muted">注目</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats?.featured_count ?? '—'}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        {listQuery.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            読み込み中...
          </p>
        ) : listQuery.isError ? (
          <p className="px-4 py-10 text-center text-sm text-red-300">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : 'お知らせの取得に失敗しました'}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            お知らせはまだありません。
          </p>
        ) : (
          <AnnouncementTable
            items={items}
            deletingId={
              deleteMutation.isPending
                ? deleteMutation.variables?.id
                : null
            }
            onDelete={(id) => {
              setError(null);
              setMessage(null);
              if (!window.confirm('このお知らせを削除（非公開）しますか？')) {
                return;
              }
              void deleteMutation
                .mutateAsync({ id })
                .then((result) => {
                  setMessage(result.message ?? 'お知らせを非公開にしました');
                })
                .catch((err) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'お知らせの削除に失敗しました',
                  );
                });
            }}
          />
        )}
      </Card>
    </div>
  );
}
