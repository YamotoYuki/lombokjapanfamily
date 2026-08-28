import MaintenanceScreen from '@/components/public/MaintenanceScreen';
import { useSettings } from '@/hooks/useSettings';

/** Standalone maintenance page route (also used when settings.maintenance_mode). */
export default function MaintenancePage() {
  const { data } = useSettings();
  return <MaintenanceScreen settings={data} />;
}
