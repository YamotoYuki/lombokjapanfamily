import { USER_STATUS_LABEL, type UserStatus } from '@/types/user';

const CLASS: Record<UserStatus, string> = {
  active: 'bg-success/15 text-success',
  inactive: 'bg-white/10 text-muted',
  suspended: 'bg-warning/15 text-warning',
};

export default function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
        CLASS[status],
      ].join(' ')}
    >
      {USER_STATUS_LABEL[status]}
    </span>
  );
}
