import { useTranslation } from 'react-i18next';
import { USER_ROLE_LABEL, type UserRole } from '@/types/user';

interface RoleSelectorProps {
  /** null = no role assigned yet; shown as a non-selectable placeholder. */
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

export default function RoleSelector({
  value,
  onChange,
  disabled,
}: RoleSelectorProps) {
  const { t } = useTranslation();
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => {
        if (event.target.value) onChange(event.target.value as UserRole);
      }}
      className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none disabled:opacity-50"
    >
      {value === null ? (
        <option value="" disabled>
          {t('admin.users.roles.unassigned')}
        </option>
      ) : null}
      {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((role) => (
        <option key={role} value={role}>
          {t(`admin.users.roles.${role}`)}
        </option>
      ))}
    </select>
  );
}
