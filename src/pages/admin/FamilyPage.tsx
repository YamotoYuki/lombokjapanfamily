import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { FamilyCard, FamilyTable } from '@/components/family';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import {
  useFamilyProfiles,
  useHardDeleteFamilyProfile,
  useReorderFamilyProfiles,
  useUpdateFamilyProfile,
} from '@/hooks/useFamilyProfiles';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { FamilyProfile } from '@/types/family';

export default function FamilyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const listQuery = useFamilyProfiles(false);
  const updateMutation = useUpdateFamilyProfile();
  const reorderMutation = useReorderFamilyProfiles();
  const deleteMutation = useHardDeleteFamilyProfile();

  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('card');
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
      setMessage(result.message ?? t('admin.common.orderUpdated'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.common.networkError'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVisibility = async (item: FamilyProfile) => {
    setBusyId(item.id);
    setError(null);
    try {
      const nextVisible = !item.is_visible;
      const result = await updateMutation.mutateAsync({
        id: item.id,
        input: { is_visible: nextVisible },
      });
      setMessage(
        result.message ??
          (nextVisible
            ? t('admin.pages.family.shown')
            : t('admin.pages.family.hid')),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.common.networkError'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: FamilyProfile) => {
    if (!window.confirm(t('admin.pages.family.deleteConfirm'))) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteMutation.mutateAsync(item.id);
      setMessage(result.message ?? t('admin.pages.family.deleted'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.pages.family.deleteFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            {t('admin.titles.family')}
          </p>
          <h2 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.pages.family.manageTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.family.description')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            allowTable={allowTable}
          />
          <LinkButton to="/admin/family/new" className="w-full sm:w-auto">
            {t('admin.common.createNew')}
          </LinkButton>
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
                : t('admin.pages.family.fetchFailed')
              : message)}
        </div>
      )}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : items.length === 0 ? (
        <Card className="px-4 py-10 text-center text-sm text-muted">
          {t('admin.pages.family.empty')}
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {items.map((member) => (
            <FamilyCard
              key={member.id}
              member={member}
              busy={busyId === member.id}
              onEdit={(item) => navigate(`/admin/family/${item.id}/edit`)}
              onToggleVisibility={handleToggleVisibility}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <FamilyTable
            items={items}
            busyId={busyId}
            onEdit={(item) => navigate(`/admin/family/${item.id}/edit`)}
            onToggleVisibility={handleToggleVisibility}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        </Card>
      )}
    </div>
  );
}
