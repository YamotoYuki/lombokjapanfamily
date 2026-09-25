import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ContactPriorityBadge from '@/components/contact/ContactPriorityBadge';
import ContactStatusBadge from '@/components/contact/ContactStatusBadge';
import {
  formatContactDate,
  type Contact,
  type ContactStatus,
  type ContactType,
} from '@/types/contact';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface ContactTableProps {
  contacts: Contact[];
  busyId?: string | null;
  viewMode?: ViewMode;
  onStatusChange: (contact: Contact, status: ContactStatus) => void;
  onArchive: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

const STATUS_OPTIONS: ContactStatus[] = [
  'new',
  'in_progress',
  'completed',
  'archived',
];

export default function ContactTable({
  contacts,
  busyId,
  viewMode = 'table',
  onStatusChange,
  onArchive,
  onDelete,
}: ContactTableProps) {
  const { t } = useTranslation();

  const typeLabel = (type: ContactType) => t(`admin.contact.types.${type}`);

  const statusSelect = (contact: Contact, busy: boolean, className: string) => (
    <select
      disabled={busy}
      value={contact.status}
      onChange={(event) =>
        onStatusChange(contact, event.target.value as ContactStatus)
      }
      className={className}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {t(`admin.contact.status.${status}`)}
        </option>
      ))}
    </select>
  );

  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        {t('admin.contact.empty')}
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid gap-3">
        {contacts.map((contact) => {
          const busy = busyId === contact.id;
          return (
            <article
              key={contact.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {contact.subject}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {contact.contact_name}
                    {contact.company_name ? ` · ${contact.company_name}` : ''}
                  </p>
                </div>
                <ContactStatusBadge status={contact.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                <span>{typeLabel(contact.contact_type)}</span>
                <ContactPriorityBadge priority={contact.priority} />
                <span>{formatContactDate(contact.created_at)}</span>
              </div>
              <p className="mt-2 break-all text-xs text-muted">{contact.email}</p>
              <p className="mt-1 text-xs text-muted">
                {t('admin.contact.phonePrefix', {
                  phone: contact.phone?.trim() || '—',
                })}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  to={`/admin/contact/${contact.id}/edit`}
                  className="touch-target inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-gold/40 hover:text-gold"
                >
                  {t('admin.common.detail')}
                </Link>
                {statusSelect(
                  contact,
                  busy,
                  'touch-input flex-1 rounded-xl border border-border bg-primary-bg/70 px-3 text-center text-sm text-white outline-none',
                )}
                <button
                  type="button"
                  disabled={busy || contact.status === 'archived'}
                  onClick={() => onArchive(contact)}
                  className="touch-target rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                >
                  {t('admin.contact.archive')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(contact)}
                  className="touch-target rounded-xl border border-youtube-red/40 bg-youtube-red/10 px-3 text-sm text-red-200 hover:bg-youtube-red/20 disabled:opacity-40"
                >
                  {t('admin.common.delete')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[9%]" />
          <col className="w-[13%]" />
          <col className="w-[9%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
          <col className="w-[7%]" />
          <col className="w-[7%]" />
          <col className="w-[9%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.contact.companyName')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.contact.contactName')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.common.email')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.common.phone')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.contact.subject')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.contact.type')}
            </th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap">
              {t('admin.contact.state')}
            </th>
            <th className="px-4 py-3 text-center font-medium whitespace-nowrap">
              {t('admin.contact.priority')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.contact.receivedAt')}
            </th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const busy = busyId === contact.id;
            return (
              <tr
                key={contact.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td
                  className="truncate px-4 py-3 align-middle text-white"
                  title={contact.company_name || undefined}
                >
                  {contact.company_name || '—'}
                </td>
                <td
                  className="truncate px-4 py-3 align-middle text-white"
                  title={contact.contact_name}
                >
                  {contact.contact_name}
                </td>
                <td
                  className="truncate px-4 py-3 align-middle text-muted"
                  title={contact.email}
                >
                  {contact.email}
                </td>
                <td className="truncate px-4 py-3 align-middle text-muted">
                  {contact.phone?.trim() || '—'}
                </td>
                <td
                  className="truncate px-4 py-3 align-middle text-white"
                  title={contact.subject}
                >
                  {contact.subject}
                </td>
                <td className="truncate px-4 py-3 align-middle text-muted">
                  {typeLabel(contact.contact_type)}
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <ContactStatusBadge status={contact.status} />
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <ContactPriorityBadge priority={contact.priority} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-muted">
                  {formatContactDate(contact.created_at)}
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      to={`/admin/contact/${contact.id}/edit`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-2 py-1.5 text-[11px] text-muted transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      {t('admin.common.detail')}
                    </Link>
                    {statusSelect(
                      contact,
                      busy,
                      'w-full rounded-xl border border-border bg-primary-bg/70 px-2 py-1.5 text-center text-[11px] text-white outline-none',
                    )}
                    <button
                      type="button"
                      disabled={busy || contact.status === 'archived'}
                      onClick={() => onArchive(contact)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-2 py-1.5 text-[11px] text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                    >
                      {t('admin.contact.archive')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(contact)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-youtube-red/40 bg-youtube-red/10 px-2 py-1.5 text-[11px] text-red-200 transition-colors hover:bg-youtube-red/20 disabled:opacity-40"
                    >
                      {t('admin.common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
