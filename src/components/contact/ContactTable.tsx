import { Link } from 'react-router-dom';
import ContactPriorityBadge from '@/components/contact/ContactPriorityBadge';
import ContactStatusBadge from '@/components/contact/ContactStatusBadge';
import {
  CONTACT_TYPE_LABEL,
  formatContactDate,
  type Contact,
  type ContactStatus,
} from '@/types/contact';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface ContactTableProps {
  contacts: Contact[];
  busyId?: string | null;
  viewMode?: ViewMode;
  onStatusChange: (contact: Contact, status: ContactStatus) => void;
  onArchive: (contact: Contact) => void;
}

export default function ContactTable({
  contacts,
  busyId,
  viewMode = 'table',
  onStatusChange,
  onArchive,
}: ContactTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        お問い合わせはまだありません。
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
                <span>{CONTACT_TYPE_LABEL[contact.contact_type]}</span>
                <ContactPriorityBadge priority={contact.priority} />
                <span>{formatContactDate(contact.created_at)}</span>
              </div>
              <p className="mt-2 break-all text-xs text-muted">{contact.email}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  to={`/admin/contact/${contact.id}/edit`}
                  className="touch-target inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-gold/40 hover:text-gold"
                >
                  詳細
                </Link>
                <select
                  disabled={busy}
                  value={contact.status}
                  onChange={(event) =>
                    onStatusChange(
                      contact,
                      event.target.value as ContactStatus,
                    )
                  }
                  className="touch-input flex-1 rounded-xl border border-border bg-primary-bg/70 px-3 text-sm text-white outline-none"
                >
                  <option value="new">未対応</option>
                  <option value="in_progress">対応中</option>
                  <option value="completed">完了</option>
                  <option value="archived">アーカイブ</option>
                </select>
                <button
                  type="button"
                  disabled={busy || contact.status === 'archived'}
                  onClick={() => onArchive(contact)}
                  className="touch-target rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                >
                  アーカイブ
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
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium">会社名</th>
            <th className="px-4 py-3 font-medium">担当者</th>
            <th className="px-4 py-3 font-medium">メール</th>
            <th className="px-4 py-3 font-medium">件名</th>
            <th className="px-4 py-3 font-medium">種別</th>
            <th className="px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium">優先度</th>
            <th className="px-4 py-3 font-medium">受信日</th>
            <th className="px-4 py-3 font-medium">操作</th>
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
                <td className="px-4 py-3 text-white">
                  {contact.company_name || '—'}
                </td>
                <td className="px-4 py-3 text-white">{contact.contact_name}</td>
                <td className="px-4 py-3 text-muted">{contact.email}</td>
                <td className="px-4 py-3 text-white">{contact.subject}</td>
                <td className="px-4 py-3 text-muted">
                  {CONTACT_TYPE_LABEL[contact.contact_type]}
                </td>
                <td className="px-4 py-3">
                  <ContactStatusBadge status={contact.status} />
                </td>
                <td className="px-4 py-3">
                  <ContactPriorityBadge priority={contact.priority} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatContactDate(contact.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/contact/${contact.id}/edit`}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted hover:border-gold/40 hover:text-gold"
                    >
                      詳細
                    </Link>
                    <select
                      disabled={busy}
                      value={contact.status}
                      onChange={(event) =>
                        onStatusChange(
                          contact,
                          event.target.value as ContactStatus,
                        )
                      }
                      className="rounded-xl border border-border bg-primary-bg/70 px-2 py-1 text-xs text-white outline-none"
                    >
                      <option value="new">未対応</option>
                      <option value="in_progress">対応中</option>
                      <option value="completed">完了</option>
                      <option value="archived">アーカイブ</option>
                    </select>
                    <button
                      type="button"
                      disabled={busy || contact.status === 'archived'}
                      onClick={() => onArchive(contact)}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                    >
                      アーカイブ
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
