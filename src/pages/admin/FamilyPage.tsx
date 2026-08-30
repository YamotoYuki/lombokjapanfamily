import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FamilyCard, FamilyTable } from '@/components/family';
import { Button, Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useDeleteDummyFamilyProfiles,
  useFamilyProfiles,
  useReorderFamilyProfiles,
  useUpdateFamilyProfile,
} from '@/hooks/useFamilyProfiles';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import { isDummyFamilyProfile } from '@/lib/familyDummy';
import type { FamilyProfile } from '@/types/family';

type NameFilter = 'all' | 'dummy' | 'real';

export default function FamilyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const listQuery = useFamilyProfiles(false);
  const updateMutation = useUpdateFamilyProfile();
  const reorderMutation = useReorderFamilyProfiles();
  const deleteDummyMutation = useDeleteDummyFamilyProfiles();

  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('card');
  const [nameFilter, setNameFilter] = useState<NameFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allItems = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const dummyCount = useMemo(
    () => allItems.filter((item) => isDummyFamilyProfile(item)).length,
    [allItems],
  );
  const items = useMemo(() => {
    if (nameFilter === 'dummy') {
      return allItems.filter((item) => isDummyFamilyProfile(item));
    }
    if (nameFilter === 'real') {
      return allItems.filter((item) => !isDummyFamilyProfile(item));
    }
    return allItems;
  }, [allItems, nameFilter]);

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

  const handleDeleteDummy = async () => {
    if (dummyCount === 0) {
      setMessage('削除対象のDUMMYデータはありません');
      return;
    }
    const ok = window.confirm(
      `「DUMMY -」で始まるプロフィールを ${dummyCount} 件、完全削除します。よろしいですか？`,
    );
    if (!ok) return;
    setError(null);
    try {
      const result = await deleteDummyMutation.mutateAsync();
      setMessage(
        result.message ??
          `DUMMYデータを${result.payload.deleted_count}件削除しました`,
      );
      setNameFilter('all');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'DUMMYデータの削除に失敗しました',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Family</p>
          <h2 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">
            ファミリー管理
          </h2>
          <p className="mt-2 text-sm text-muted">
            実データへ差し替えやすいよう、DUMMYデータの絞り込み・一括削除に対応しています。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            allowTable={allowTable}
          />
          <LinkButton to="/admin/family/new" className="w-full sm:w-auto">
            新規追加
          </LinkButton>
        </div>
      </div>

      <Card className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              Filters
            </p>
            <p className="mt-1 text-sm text-muted">
              DUMMY検出: {dummyCount} 件 / 全体 {allItems.length} 件
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={deleteDummyMutation.isPending || dummyCount === 0}
            onClick={() => void handleDeleteDummy()}
          >
            {deleteDummyMutation.isPending
              ? '削除中...'
              : 'DUMMYデータ削除'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'すべて' },
              { id: 'real', label: '実データのみ' },
              { id: 'dummy', label: 'DUMMYのみ' },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setNameFilter(option.id)}
              className={[
                'touch-target min-h-11 rounded-2xl border px-3 py-2 text-sm transition-colors',
                nameFilter === option.id
                  ? 'border-youtube-red/50 bg-youtube-red/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-muted hover:border-gold/40 hover:text-gold',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

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
      ) : items.length === 0 ? (
        <Card className="px-4 py-10 text-center text-sm text-muted">
          表示対象のプロフィールがありません。
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((member) => (
            <FamilyCard
              key={member.id}
              member={member}
              busy={busyId === member.id}
              onEdit={(item) => navigate(`/admin/family/${item.id}/edit`)}
              onToggleVisibility={async (item) => {
                setBusyId(item.id);
                try {
                  const nextVisible = !item.is_visible;
                  const result = await updateMutation.mutateAsync({
                    id: item.id,
                    input: { is_visible: nextVisible },
                  });
                  setMessage(
                    result.message ??
                      (nextVisible
                        ? '家族プロフィールを表示にしました'
                        : '家族プロフィールを非表示にしました'),
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
            onToggleVisibility={async (item) => {
              setBusyId(item.id);
              try {
                const nextVisible = !item.is_visible;
                const result = await updateMutation.mutateAsync({
                  id: item.id,
                  input: { is_visible: nextVisible },
                });
                setMessage(
                  result.message ??
                    (nextVisible
                      ? '家族プロフィールを表示にしました'
                      : '家族プロフィールを非表示にしました'),
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
