import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FamilyCard, FamilyTable } from '@/components/family';
import { Button, Card } from '@/components/ui';
import {
  useFamilyProfiles,
  useHideFamilyProfile,
  useReorderFamilyProfiles,
} from '@/hooks/useFamilyProfiles';
import type { FamilyProfile } from '@/types/family';

export default function FamilyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const listQuery = useFamilyProfiles(false);
  const hideMutation = useHideFamilyProfile();
  const reorderMutation = useReorderFamilyProfiles();

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleMove = async (
    member: FamilyProfile,
    direction: 'up' | 'down',
  ) => {
    const index = items.findIndex((item) => item.id === member.id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    setBusyId(member.id);
    setError(null);
    try {
      const result = await reorderMutation.mutateAsync(
        next.map((item, order) => ({
          id: item.id,
          display_order: order + 1,
        })),
      );
      setMessage(result.message ?? '表示順を更新しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Family</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">ファミリー管理</h2>
          <p className="mt-2 text-sm text-muted">
            一覧から編集ページへ移動してプロフィールを更新できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setViewMode((prev) => (prev === 'card' ? 'table' : 'card'))
            }
          >
            {viewMode === 'card' ? 'テーブル表示' : 'カード表示'}
          </Button>
          <Link to="/admin/family/new">
            <Button type="button">新規追加</Button>
          </Link>
        </div>
      </div>

      {(message || error || listQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || listQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ||
            (listQuery.isError
              ? listQuery.error instanceof Error
                ? listQuery.error.message
                : '家族プロフィールの取得に失敗しました'
              : message)}
        </div>
      )}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((member) => (
            <FamilyCard
              key={member.id}
              member={member}
              busy={busyId === member.id}
              onEdit={(item) => navigate(`/admin/family/${item.id}/edit`)}
              onHide={async (item) => {
                setBusyId(item.id);
                try {
                  const result = await hideMutation.mutateAsync(item.id);
                  setMessage(
                    result.message ?? '家族プロフィールを非表示にしました',
                  );
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : '通信エラーが発生しました',
                  );
                } finally {
                  setBusyId(null);
                }
              }}
              onMove={handleMove}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <FamilyTable
            items={items}
            busyId={busyId}
            onEdit={(item) => navigate(`/admin/family/${item.id}/edit`)}
            onHide={async (item) => {
              setBusyId(item.id);
              try {
                const result = await hideMutation.mutateAsync(item.id);
                setMessage(
                  result.message ?? '家族プロフィールを非表示にしました',
                );
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : '通信エラーが発生しました',
                );
              } finally {
                setBusyId(null);
              }
            }}
            onMove={handleMove}
          />
        </Card>
      )}
    </div>
  );
}
