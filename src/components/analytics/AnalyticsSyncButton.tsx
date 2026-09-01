import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <RoleGuard allowedRoles={['admin']}>
      <Button type="button" onClick={onSync} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? t('admin.common.syncing') : t('admin.analytics.syncGa4')}
      </Button>
    </RoleGuard>
  );
}
