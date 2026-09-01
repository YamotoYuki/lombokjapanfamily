import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import {
  ContactDetailCard,
  ContactNoteEditor,
} from '@/components/contact';
import { Button, Card, Input } from '@/components/ui';
import { useContact, useUpdateContact } from '@/hooks/useContacts';
import type { ContactPriority, ContactStatus } from '@/types/contact';

export default function ContactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const contactQuery = useContact(id);
  const updateMutation = useUpdateContact();
  const [assignedTo, setAssignedTo] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setAssignedTo(contactQuery.data?.assigned_to ?? '');
  }, [contactQuery.data?.assigned_to]);

  if (contactQuery.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        {t('admin.pages.contact.loadingDetail')}
      </div>
    );
  }

  if (contactQuery.isError || !contactQuery.data || (id && contactQuery.data.id !== id)) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.contact.resource')}
        backTo="/admin/contact"
        detail={
          contactQuery.error instanceof Error
            ? contactQuery.error.message
            : undefined
        }
      />
    );
  }

  const contact = contactQuery.data;

  const runUpdate = async (
    input: Parameters<typeof updateMutation.mutateAsync>[0]['input'],
  ) => {
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await updateMutation.mutateAsync({
        id: contact.id,
        input,
      });
      setActionMessage(result.message ?? t('admin.common.statusUpdated'));
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : t('admin.common.statusUpdateFailed'),
      );
    }
  };

  return (
    <AdminEditChrome
      eyebrow={t('admin.pages.contact.editEyebrow')}
      title={
        contact.contact_name ||
        contact.subject ||
        t('admin.pages.contact.resource')
      }
      subtitle={contact.email}
      backTo="/admin/contact"
      message={actionMessage}
      error={actionError}
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <ContactDetailCard contact={contact} />

          <div className="space-y-4">
            <Card className="space-y-4">
              <h3 className="text-sm font-semibold text-white">
                {t('admin.pages.contact.handling')}
              </h3>
              <div className="space-y-2">
                <label className="text-sm text-muted">
                  {t('admin.common.status')}
                </label>
                <select
                  value={contact.status}
                  onChange={(event) =>
                    void runUpdate({
                      status: event.target.value as ContactStatus,
                    })
                  }
                  className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="new">{t('admin.pages.contact.statusNew')}</option>
                  <option value="in_progress">
                    {t('admin.pages.contact.statusInProgress')}
                  </option>
                  <option value="completed">
                    {t('admin.pages.contact.statusDone')}
                  </option>
                  <option value="archived">
                    {t('admin.pages.contact.statusArchived')}
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted">
                  {t('admin.common.priority')}
                </label>
                <select
                  value={contact.priority}
                  onChange={(event) =>
                    void runUpdate({
                      priority: event.target.value as ContactPriority,
                    })
                  }
                  className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="low">
                    {t('admin.pages.contact.priorityLow')}
                  </option>
                  <option value="normal">
                    {t('admin.pages.contact.priorityNormal')}
                  </option>
                  <option value="high">
                    {t('admin.pages.contact.priorityHigh')}
                  </option>
                  <option value="urgent">
                    {t('admin.pages.contact.priorityUrgent')}
                  </option>
                </select>
              </div>
              <Input
                label={t('admin.pages.contact.assigneeLabel')}
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                placeholder="Supabase user UUID"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  void runUpdate({ assigned_to: assignedTo || undefined })
                }
              >
                {t('admin.pages.contact.saveAssignee')}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void runUpdate({ status: 'completed' })}
                >
                  {t('admin.pages.contact.markDone')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void runUpdate({ status: 'archived' })}
                >
                  {t('admin.pages.contact.archive')}
                </Button>
              </div>
            </Card>

            <ContactNoteEditor
              key={contact.id}
              value={contact.internal_note ?? ''}
              saving={updateMutation.isPending}
              onSave={async (note) => {
                await runUpdate({ internal_note: note });
              }}
            />
          </div>
        </div>
      </div>
    </AdminEditChrome>
  );
}
