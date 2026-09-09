import { MailWarning } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';

interface ContactAlertCardProps {
  newCount: number;
  pendingCount: number;
}

/** Shown only while status=new > 0. No separate read state. */
export default function ContactAlertCard({
  newCount,
  pendingCount,
}: ContactAlertCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || 'ja';

  if (newCount <= 0) return null;

  return (
    <Card className="border-youtube-red/30 bg-youtube-red/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-2xl bg-youtube-red/20 p-3 text-youtube-red">
            <MailWarning size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {t('admin.dashboard.contactAlertTitle')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
              <div className="rounded-xl border border-white/10 bg-primary-bg/40 px-3 py-2.5">
                <p className="text-[11px] text-muted">
                  {t('admin.dashboard.pendingContactsLabel')}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {t('admin.dashboard.contactCountUnit', {
                    count: pendingCount.toLocaleString(locale),
                  })}
                </p>
              </div>
              <div className="rounded-xl border border-youtube-red/30 bg-youtube-red/15 px-3 py-2.5">
                <p className="text-[11px] text-red-200">
                  {t('admin.dashboard.newContactsLabel')}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {t('admin.dashboard.contactCountUnit', {
                    count: newCount.toLocaleString(locale),
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Link
          to="/admin/contact?status=new"
          className="touch-target inline-flex shrink-0 items-center justify-center rounded-2xl bg-youtube-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
        >
          {t('admin.dashboard.openNewContacts')}
        </Link>
      </div>
    </Card>
  );
}
