import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RevenueCharts,
  SponsorFilters,
  SponsorStatsCards,
  SponsorTable,
} from '@/components/sponsors';
import { Button, Card, ViewModeToggle } from '@/components/ui';
import {
  useDeleteSponsor,
  useSponsors,
  useUpdateSponsor,
} from '@/hooks/useSponsors';
import { useSponsorStats } from '@/hooks/useSponsorStats';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { SponsorStatus, SponsorType } from '@/types/sponsor';

export default function SponsorsPage() {
  const [viewMode, setViewMode] = useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<SponsorStatus | ''>('');
  const [projectType, setProjectType] = useState<SponsorType | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      type: projectType || undefined,
      page: 1,
      limit: 50,
    }),
    [keyword, status, projectType],
  );

  const listQuery = useSponsors(params);
  const statsQuery = useSponsorStats();
  const updateMutation = useUpdateSponsor();
  const deleteMutation = useDeleteSponsor();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Sponsors
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            スポンサー・企業案件
          </h2>
          <p className="mt-2 text-sm text-muted">
            契約・進捗・売上・添付ファイルを一元管理します。
          </p>
        </div>
        <Link to="/admin/sponsors/new">
          <Button type="button">案件登録</Button>
        </Link>
      </div>

      <SponsorStatsCards
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />

      <RevenueCharts stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      <SponsorFilters
        keyword={keyword}
        status={status}
        projectType={projectType}
        onKeywordChange={setKeyword}
        onStatusChange={setStatus}
        onTypeChange={setProjectType}
      />

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
                : '案件の取得に失敗しました'
              : message)}
        </div>
      )}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <h3 className="font-medium text-white">案件一覧</h3>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
          <SponsorTable
            items={listQuery.data?.items ?? []}
            busyId={busyId}
            viewMode={viewMode}
            onStatusChange={async (item, nextStatus) => {
              setBusyId(item.id);
              setError(null);
              setMessage(null);
              try {
                const result = await updateMutation.mutateAsync({
                  id: item.id,
                  input: { status: nextStatus },
                });
                setMessage(result.message ?? '案件を更新しました');
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
            onDelete={async (item) => {
              setBusyId(item.id);
              setError(null);
              setMessage(null);
              try {
                const result = await deleteMutation.mutateAsync(item.id);
                setMessage(result.message ?? '案件を削除しました');
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
          />
        </Card>
      )}
    </div>
  );
}
