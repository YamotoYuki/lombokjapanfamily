import type { ReactNode } from 'react';
import { Building2, Mail, Phone, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import ContactPriorityBadge from '@/components/contact/ContactPriorityBadge';
import ContactStatusBadge from '@/components/contact/ContactStatusBadge';
import { formatContactDate, type Contact } from '@/types/contact';

interface ContactDetailCardProps {
  contact: Contact;
}

export default function ContactDetailCard({ contact }: ContactDetailCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <ContactStatusBadge status={contact.status} />
        <ContactPriorityBadge priority={contact.priority} />
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-muted">
          {t(`admin.contact.types.${contact.contact_type}`)}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white">{contact.subject}</h2>
        <p className="mt-2 text-sm text-muted">
          {t('admin.contact.receivedUpdated', {
            received: formatContactDate(contact.created_at),
            updated: formatContactDate(contact.updated_at),
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoItem
          icon={<Building2 size={16} />}
          label={t('admin.contact.companyName')}
          value={contact.company_name || '—'}
        />
        <InfoItem
          icon={<User size={16} />}
          label={t('admin.contact.contactNameFull')}
          value={contact.contact_name}
        />
        <InfoItem
          icon={<Mail size={16} />}
          label={t('admin.common.email')}
          value={contact.email}
        />
        <InfoItem
          icon={<Phone size={16} />}
          label={t('admin.common.phone')}
          value={contact.phone || '—'}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-muted">
          {t('admin.contact.content')}
        </p>
        <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-primary-bg/40 p-4 text-sm leading-relaxed text-white/90">
          {contact.message}
        </p>
      </div>

      {contact.attachment_url && (
        <div>
          <p className="text-sm font-medium text-muted">
            {t('admin.contact.attachment')}
          </p>
          <a
            href={contact.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm text-gold hover:text-amber-300"
          >
            {contact.attachment_name || t('admin.contact.openAttachment')}
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
