import { useTranslation } from 'react-i18next';

interface FamilyVisibilityBadgeProps {
  visible: boolean;
}

export default function FamilyVisibilityBadge({
  visible,
}: FamilyVisibilityBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
        visible
          ? 'bg-success/15 text-success'
          : 'bg-white/10 text-muted',
      ].join(' ')}
    >
      {visible ? t('admin.common.publishing') : t('admin.common.hidden')}
    </span>
  );
}
