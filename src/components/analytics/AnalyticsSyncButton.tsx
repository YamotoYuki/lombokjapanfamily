import { RoleGuard } from '@/components/auth';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface AnalyticsSyncButtonProps {
  loading?: boolean;
  onSync: () => void;
}

export default function AnalyticsSyncButton({
  loading,
  onSync,
}: AnalyticsSyncButtonProps) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <Button type="button" onClick={onSync} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? '同期中...' : 'GA4同期'}
      </Button>
    </RoleGuard>
  );
}
