import type { ReactNode } from 'react';
import { Building2, Mail, Phone, User } from 'lucide-react';
import { Card } from '@/components/ui';
import ContactPriorityBadge from '@/components/contact/ContactPriorityBadge';
import ContactStatusBadge from '@/components/contact/ContactStatusBadge';
import {
  CONTACT_TYPE_LABEL,
  formatContactDate,
  type Contact,
} from '@/types/contact';

interface ContactDetailCardProps {
  contact: Contact;
}

export default function ContactDetailCard({ contact }: ContactDetailCardProps) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <ContactStatusBadge status={contact.status} />
        <ContactPriorityBadge priority={contact.priority} />
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-muted">
          {CONTACT_TYPE_LABEL[contact.contact_type]}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white">{contact.subject}</h2>
        <p className="mt-2 text-sm text-muted">
          受信: {formatContactDate(contact.created_at)} / 更新:{' '}
          {formatContactDate(contact.updated_at)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoItem
          icon={<Building2 size={16} />}
          label="会社名"
          value={contact.company_name || '—'}
        />
        <InfoItem
          icon={<User size={16} />}
          label="担当者名"
          value={contact.contact_name}
        />
        <InfoItem
          icon={<Mail size={16} />}
          label="メール"
          value={contact.email}
        />
        <InfoItem
          icon={<Phone size={16} />}
          label="電話番号"
          value={contact.phone || '—'}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-muted">内容</p>
        <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-primary-bg/40 p-4 text-sm leading-relaxed text-white/90">
          {contact.message}
        </p>
      </div>

      {contact.attachment_url && (
        <div>
          <p className="text-sm font-medium text-muted">添付ファイル</p>
          <a
            href={contact.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm text-gold hover:text-amber-300"
          >
            {contact.attachment_name || '添付ファイルを開く'}
          </a>
        </div>
      )}
    </Card>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-primary-bg/40 px-4 py-3">
      <p className="inline-flex items-center gap-2 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
