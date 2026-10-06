import { useTranslation } from 'react-i18next';
import type { UserRole } from '@/types/user';

const CLASS: Record<UserRole, string> = {
  admin: 'bg-youtube-red/15 text-youtube-red',
  editor: 'bg-gold/15 text-gold',
  viewer: 'bg-white/10 text-muted',
};

const UNASSIGNED_CLASS = 'border border-dashed border-white/20 text-muted';

export default function UserRoleBadge({ role }: { role: UserRole | null }) {
  const { t } = useTranslation();
  return (
    <span
      className={[
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium uppercase',
        role ? CLASS[role] : UNASSIGNED_CLASS,
      ].join(' ')}
    >
      {t(`admin.users.roles.${role ?? 'unassigned'}`)}
    </span>
  );
}
