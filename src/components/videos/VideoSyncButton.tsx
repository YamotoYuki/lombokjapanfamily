import { RefreshCw } from 'lucide-react';
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
  return (
    <Button
      type="button"
      onClick={onSync}
      disabled={disabled || isLoading}
      className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      {isLoading ? '同期中...' : 'YouTube同期'}
    </Button>
  );
}
