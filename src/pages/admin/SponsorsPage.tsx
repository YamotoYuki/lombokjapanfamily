import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RevenueCharts,
  SponsorFilters,
  SponsorStatsCards,
  SponsorTable,
} from '@/components/sponsors';
import { Card, ConfirmDialog, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useDeleteSponsor,
  useSponsors,
  useUpdateSponsor,
} from '@/hooks/useSponsors';
import { useSponsorStats } from '@/hooks/useSponsorStats';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { Sponsor, SponsorStatus, SponsorType } from '@/types/sponsor';

export default function SponsorsPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<SponsorStatus | ''>('');
  const [projectType, setProjectType] = useState<SponsorType | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Sponsor | null>(null);

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
            {t('admin.pages.sponsors.manageTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.sponsors.description')}
          </p>
        </div>
        <LinkButton to="/admin/sponsors/new">
          {t('admin.pages.sponsors.register')}
        </LinkButton>
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
                : t('admin.pages.sponsors.fetchFailed')
              : message)}
        </div>
      )}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <h3 className="font-medium text-white">
              {t('admin.pages.sponsors.listTitle')}
            </h3>
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
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
                setMessage(result.message ?? t('admin.pages.sponsors.updated'));
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : t('admin.common.networkError'),
                );
              } finally {
                setBusyId(null);
              }
            }}
            onDelete={(item) => setPendingDelete(item)}
          />
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        detail={
          pendingDelete?.company_name ||
          pendingDelete?.project_name ||
          undefined
        }
        confirming={Boolean(pendingDelete && busyId === pendingDelete.id)}
        onCancel={() => {
          if (!busyId) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete || busyId) return;
          void (async () => {
            setBusyId(pendingDelete.id);
            setError(null);
            setMessage(null);
            try {
              const result = await deleteMutation.mutateAsync(pendingDelete.id);
              setMessage(
                result.message ?? t('admin.pages.sponsors.deleted'),
              );
              setPendingDelete(null);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.common.networkError'),
              );
            } finally {
              setBusyId(null);
            }
          })();
        }}
      />
    </div>
  );
}
