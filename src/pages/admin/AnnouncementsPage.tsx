import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Megaphone, Plus, Star } from 'lucide-react';
import { AnnouncementTable } from '@/components/announcements';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useAnnouncementStats,
  useAnnouncements,
  useDeleteAnnouncement,
} from '@/hooks/useAnnouncements';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();
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
            {t('admin.pages.announcements.manageTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('admin.pages.announcements.description')}
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
            {t('admin.common.create')}
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

      <section className="grid gap-4 sm:grid-cols-3">
        {(
          [
            {
              label: t('admin.common.total'),
              value: stats?.total,
              icon: Megaphone,
              accent: 'text-youtube-red bg-youtube-red/15',
            },
            {
              label: t('admin.common.publishing'),
              value: stats?.published_count,
              icon: Eye,
              accent: 'text-success bg-success/15',
            },
            {
              label: t('admin.common.featured'),
              value: stats?.featured_count,
              icon: Star,
              accent: 'text-gold bg-gold/15',
            },
          ] as const
        ).map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} hoverable>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {value != null ? value.toLocaleString() : '—'}
                </p>
              </div>
              <div className={['rounded-2xl p-3', accent].join(' ')}>
                <Icon size={18} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card className={viewMode === 'table' ? 'overflow-x-auto p-0' : '!p-0'}>
        {listQuery.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {t('admin.common.loading')}
          </p>
        ) : listQuery.isError ? (
          <p className="px-4 py-10 text-center text-sm text-red-300">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : t('admin.pages.announcements.fetchFailed')}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {t('admin.pages.announcements.empty')}
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
              if (!window.confirm(t('admin.pages.announcements.deleteConfirm'))) {
                return;
              }
              void deleteMutation
                .mutateAsync({ id, hard: true })
                .then((result) => {
                  setMessage(
                    result.message ?? t('admin.pages.announcements.deleted'),
                  );
                })
                .catch((err) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : t('admin.pages.announcements.deleteFailed'),
                  );
                });
            }}
          />
        )}
      </Card>
    </div>
  );
}
