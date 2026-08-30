import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AnnouncementTable } from '@/components/announcements';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useAnnouncementStats,
  useAnnouncements,
  useDeleteAnnouncement,
} from '@/hooks/useAnnouncements';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';

export default function AdminAnnouncementsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listQuery = useAnnouncements({ page: 1, limit: 100 });
  const statsQuery = useAnnouncementStats();
  const deleteMutation = useDeleteAnnouncement();

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const items = listQuery.data?.items ?? [];
  const stats = statsQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            allowTable={allowTable}
          />
          <LinkButton to="/admin/announcements/new" className="w-full sm:w-auto">
            <Plus size={16} />
            新規作成
          </LinkButton>
        </div>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      <Card className={viewMode === 'table' ? 'overflow-x-auto p-0' : '!p-0'}>
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
            viewMode={viewMode}
            deletingId={
              deleteMutation.isPending
                ? deleteMutation.variables?.id
                : null
            }
            onDelete={(id) => {
              setError(null);
              setMessage(null);
              if (
                !window.confirm(
                  'このお知らせを完全に削除しますか？この操作は取り消せません。',
                )
              ) {
                return;
              }
              void deleteMutation
                .mutateAsync({ id, hard: true })
                .then((result) => {
                  setMessage(result.message ?? 'お知らせを削除しました');
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
