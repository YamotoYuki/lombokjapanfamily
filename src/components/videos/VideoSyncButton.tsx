import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

interface VideoSyncButtonProps {
  onSync: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function VideoSyncButton({
  onSync,
  isLoading = false,
  disabled = false,
}: VideoSyncButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      onClick={onSync}
      disabled={disabled || isLoading}
      className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      {isLoading ? t('admin.common.syncing') : t('admin.videos.youtubeSync')}
    </Button>
  );
}
