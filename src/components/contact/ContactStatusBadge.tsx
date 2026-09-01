import { useTranslation } from 'react-i18next';
import type { ContactStatus } from '@/types/contact';

const toneMap: Record<ContactStatus, string> = {
  new: 'bg-youtube-red/15 text-youtube-red ring-youtube-red/30',
  in_progress: 'bg-warning/15 text-warning ring-warning/30',
  completed: 'bg-success/15 text-success ring-success/30',
  archived: 'bg-white/10 text-muted ring-white/10',
};

interface ContactStatusBadgeProps {
  status: ContactStatus;
}

export default function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        toneMap[status],
      ].join(' ')}
    >
      {t(`admin.contact.status.${status}`)}
    </span>
  );
}
