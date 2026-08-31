import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MaintenanceScreen,
  SiteFooter,
  SiteHeader,
  SiteSeo,
  SplashScreen,
} from '@/components/public';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { restorePublicLanguage } from '@/i18n';

export default function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const settingsQuery = useSettings();
  const { isAuthenticated, hasRole } = useAuth();
  const settings = settingsQuery.data;
  const maintenance = Boolean(settings?.maintenance_mode);
  const isAdmin = isAuthenticated && hasRole('admin');

  useEffect(() => {
    void restorePublicLanguage();
  }, []);

  if (maintenance && !isAdmin) {
    return (
      <>
        <SiteSeo settings={settings} path={location.pathname} noIndex />
        <MaintenanceScreen settings={settings} />
      </>
    );
  }

  return (
    <div className="public-shell flex min-h-screen flex-col bg-primary-bg">
      <SplashScreen />
      <SiteSeo settings={settings} path={location.pathname} />
      {maintenance && isAdmin ? (
        <div className="sticky top-0 z-[60] border-b border-gold/30 bg-gold/15 px-4 py-2 text-center text-xs text-gold backdrop-blur-md">
          {t('common.maintenanceBanner')}
        </div>
      ) : null}
      <SiteHeader settings={settings} />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
