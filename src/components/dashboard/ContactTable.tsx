import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import ContactStatusBadge from '@/components/contact/ContactStatusBadge';
import { formatContactDate, type Contact } from '@/types/contact';

interface ContactTableProps {
  items: Contact[];
  isLoading?: boolean;
  newCount?: number;
}

export default function ContactTable({
  items,
  isLoading = false,
  newCount,
}: ContactTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.recentContacts')}
        subtitle={
          typeof newCount === 'number'
            ? t('admin.dashboard.contactsPending', { count: newCount })
            : t('admin.dashboard.contactsList')
        }
        actionLabel={t('admin.common.viewAll')}
        actionTo="/admin/contact"
      />
      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted">
          {t('admin.common.loading')}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">
          {t('admin.dashboard.noContacts')}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/admin/contact/${item.id}`}
              className="block rounded-2xl border border-white/5 bg-primary-bg/40 px-3.5 py-3 transition-colors hover:border-white/15 hover:bg-primary-bg/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.company_name || item.contact_name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.contact_name} · {item.subject}
                  </p>
                </div>
                <ContactStatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {formatContactDate(item.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
