import { useTranslation } from 'react-i18next';
import type { ContactPriority } from '@/types/contact';

const toneMap: Record<ContactPriority, string> = {
  low: 'bg-white/10 text-muted ring-white/10',
  normal: 'bg-blue-500/15 text-blue-300 ring-blue-400/30',
  high: 'bg-warning/15 text-warning ring-warning/30',
  urgent: 'bg-youtube-red/15 text-youtube-red ring-youtube-red/30',
};

interface ContactPriorityBadgeProps {
  priority: ContactPriority;
}

export default function ContactPriorityBadge({
  priority,
}: ContactPriorityBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        toneMap[priority],
      ].join(' ')}
    >
      {t(`admin.contact.priorityLevel.${priority}`)}
    </span>
  );
}
