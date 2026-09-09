import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  ContactFilters,
  ContactStatsCards,
  ContactTable,
} from '@/components/contact';
import { Card, ConfirmDialog, ViewModeToggle } from '@/components/ui';
import {
  useArchiveContact,
  useContacts,
  useDeleteContact,
  useUpdateContact,
} from '@/hooks/useContacts';
import { useContactStats } from '@/hooks/useContactStats';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type {
  Contact,
  ContactPriority,
  ContactStatus,
  ContactType,
} from '@/types/contact';

function parseStatusParam(raw: string | null): ContactStatus | '' {
  if (
    raw === 'new' ||
    raw === 'in_progress' ||
    raw === 'completed' ||
    raw === 'archived'
  ) {
    return raw;
  }
  return '';
}

export default function AdminContactPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ContactStatus | ''>(() =>
    parseStatusParam(searchParams.get('status')),
  );
  const [contactType, setContactType] = useState<ContactType | ''>('');
  const [priority, setPriority] = useState<ContactPriority | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const locale = i18n.resolvedLanguage || i18n.language || 'ja';

  useEffect(() => {
    setStatus(parseStatusParam(searchParams.get('status')));
  }, [searchParams]);

  const handleStatusChange = (next: ContactStatus | '') => {
    setStatus(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set('status', next);
    else nextParams.delete('status');
    setSearchParams(nextParams, { replace: true });
  };

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      contact_type: contactType || undefined,
      priority: priority || undefined,
      page: 1,
      limit: 50,
    }),
    [keyword, status, contactType, priority],
  );

  const contactsQuery = useContacts(params);
  const statsQuery = useContactStats();
  const updateMutation = useUpdateContact();
  const archiveMutation = useArchiveContact();
  const deleteMutation = useDeleteContact();

  const runUpdate = async (
    contact: Contact,
    input: Parameters<typeof updateMutation.mutateAsync>[0]['input'],
  ) => {
    setBusyId(contact.id);
    setError(null);
    setMessage(null);
    try {
      const result = await updateMutation.mutateAsync({
        id: contact.id,
        input,
      });
      setMessage(result.message ?? t('admin.common.statusUpdated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.common.statusUpdateFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteMutation.mutateAsync(confirmDelete.id);
      setMessage(result.message ?? t('admin.pages.contact.deleted'));
      setConfirmDelete(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.pages.contact.deleteFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Inbox</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {t('admin.titles.contact')}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t('admin.pages.contact.description')}
        </p>
      </div>

      <ContactStatsCards
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />

      {(statsQuery.data?.new_count ?? 0) > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-100">
            {t('admin.pages.contact.newAlert', {
              count: (statsQuery.data?.new_count ?? 0).toLocaleString(locale),
            })}
          </p>
          <button
            type="button"
            onClick={() => handleStatusChange('new')}
            className="touch-target inline-flex shrink-0 items-center justify-center rounded-xl bg-youtube-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            {t('admin.pages.contact.showNewOnly')}
          </button>
        </div>
      ) : null}

      <ContactFilters
        keyword={keyword}
        status={status}
        contactType={contactType}
        priority={priority}
        onKeywordChange={setKeyword}
        onStatusChange={handleStatusChange}
        onTypeChange={setContactType}
        onPriorityChange={setPriority}
      />

      {(message || error || contactsQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || contactsQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ||
            (contactsQuery.error instanceof Error
              ? contactsQuery.error.message
              : null) ||
            message}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-medium text-white">
            {t('admin.pages.contact.listTitle')}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
            <p className="text-xs text-muted">
              {contactsQuery.isLoading
                ? t('admin.common.loading')
                : t('admin.common.count', {
                    count: contactsQuery.data?.total ?? 0,
                  })}
            </p>
          </div>
        </div>
        {contactsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted">
            {t('admin.pages.contact.loading')}
          </div>
        ) : (
          <ContactTable
            contacts={contactsQuery.data?.items ?? []}
            busyId={busyId}
            viewMode={viewMode}
            onStatusChange={(contact, nextStatus) =>
              void runUpdate(contact, { status: nextStatus })
            }
            onArchive={(contact) => {
              void (async () => {
                setBusyId(contact.id);
                setError(null);
                try {
                  const result = await archiveMutation.mutateAsync(contact.id);
                  setMessage(result.message ?? t('admin.common.statusUpdated'));
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : t('admin.common.statusUpdateFailed'),
                  );
                } finally {
                  setBusyId(null);
                }
              })();
            }}
            onDelete={(contact) => setConfirmDelete(contact)}
          />
        )}
      </Card>

      {confirmDelete ? (
        <ConfirmDialog
          open
          detail={`${confirmDelete.subject}（${confirmDelete.contact_name}）`}
          confirming={deleteMutation.isPending}
          onCancel={() => {
            if (!deleteMutation.isPending) setConfirmDelete(null);
          }}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </div>
  );
}
