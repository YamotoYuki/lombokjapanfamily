import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingOverlayProps {
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingOverlay({
  label,
  fullScreen = true,
}: LoadingOverlayProps) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        'flex items-center justify-center gap-3 bg-primary-bg/70 text-sm text-muted backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-[100]' : 'absolute inset-0 z-20 min-h-40',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="animate-spin text-youtube-red" size={22} />
      <span>{label ?? t('admin.common.loading')}</span>
    </div>
  );
}
