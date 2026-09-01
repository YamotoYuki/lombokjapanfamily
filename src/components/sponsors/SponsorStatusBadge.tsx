import { useTranslation } from 'react-i18next';
import type { SponsorStatus } from '@/types/sponsor';

const STATUS_CLASS: Record<SponsorStatus, string> = {
  proposal: 'bg-white/10 text-muted',
  negotiating: 'bg-blue-500/15 text-blue-300',
  contracted: 'bg-gold/15 text-gold',
  production: 'bg-warning/15 text-warning',
  review: 'bg-purple-500/15 text-purple-300',
  published: 'bg-youtube-red/15 text-youtube-red',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-white/5 text-muted',
};

interface SponsorStatusBadgeProps {
  status: SponsorStatus;
}

export default function SponsorStatusBadge({ status }: SponsorStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
        STATUS_CLASS[status],
      ].join(' ')}
    >
      {t(`admin.sponsors.statuses.${status}`)}
    </span>
  );
}
