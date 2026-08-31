import { useMemo, useState } from 'react';
import {
  ContactFilters,
  ContactStatsCards,
  ContactTable,
} from '@/components/contact';
import { Button, Card, ViewModeToggle } from '@/components/ui';
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

export default function AdminContactPage() {
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ContactStatus | ''>('');
  const [contactType, setContactType] = useState<ContactType | ''>('');
  const [priority, setPriority] = useState<ContactPriority | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);

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
      setMessage(result.message ?? 'ステータスを更新しました');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'ステータス更新に失敗しました',
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
      setMessage(result.message ?? 'お問い合わせを削除しました');
      setConfirmDelete(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'お問い合わせの削除に失敗しました',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Inbox</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Contact</h2>
        <p className="mt-2 text-sm text-muted">
          企業案件・コラボ・取材など、すべてのお問い合わせを管理します。
        </p>
      </div>

      <ContactStatsCards
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />

      <ContactFilters
        keyword={keyword}
        status={status}
        contactType={contactType}
        priority={priority}
        onKeywordChange={setKeyword}
        onStatusChange={setStatus}
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
          <h3 className="font-medium text-white">お問い合わせ一覧</h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
            <p className="text-xs text-muted">
              {contactsQuery.isLoading
                ? '読み込み中...'
                : `${contactsQuery.data?.total ?? 0}件`}
            </p>
          </div>
        </div>
        {contactsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted">
            お問い合わせを読み込んでいます...
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
                  setMessage(result.message ?? 'ステータスを更新しました');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ステータス更新に失敗しました',
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
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => {
            if (!deleteMutation.isPending) setConfirmDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-delete-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="contact-delete-title"
              className="text-lg font-semibold text-white"
            >
              お問い合わせを削除しますか？
            </h3>
            <p className="mt-2 text-sm text-muted">
              この操作は元に戻せません。
            </p>
            <p className="mt-2 break-words text-xs text-muted">
              {confirmDelete.subject}（{confirmDelete.contact_name}）
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={deleteMutation.isPending}
                onClick={() => setConfirmDelete(null)}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full sm:w-auto"
                disabled={deleteMutation.isPending}
                onClick={() => void handleConfirmDelete()}
              >
                {deleteMutation.isPending ? '削除中...' : '削除する'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
