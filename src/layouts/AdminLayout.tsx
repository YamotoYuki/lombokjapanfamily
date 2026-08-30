import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { forceAdminJapanese } from '@/i18n';

const titleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/videos': 'Videos',
  '/admin/blog': 'Blog',
  '/admin/blog/new': 'Blog Create',
  '/admin/blog/categories': 'Blog Categories',
  '/admin/gallery': 'Gallery',
  '/admin/gallery/categories': 'Gallery Categories',
  '/admin/contact': 'Contact',
  '/admin/family': 'Family',
  '/admin/sponsors': 'Sponsors',
  '/admin/sponsors/new': 'Sponsor Create',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { isDesktop, isTablet, isMobile } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabletCollapsed, setTabletCollapsed] = useState(true);

  useEffect(() => {
    void forceAdminJapanese();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    if (isTablet) setTabletCollapsed(true);
  }, [pathname, isTablet]);

  const title =
    titleMap[pathname] ??
    (pathname.includes('/admin/blog/') && pathname.endsWith('/edit')
      ? 'Blog Edit'
      : pathname.startsWith('/admin/contact/')
        ? 'Contact Detail'
        : pathname.match(/\/admin\/sponsors\/[^/]+\/edit$/)
          ? 'Sponsor Edit'
          : pathname.match(/\/admin\/sponsors\/[^/]+$/)
            ? 'Sponsor Detail'
            : pathname.match(/\/admin\/users\/[^/]+$/)
              ? 'User Detail'
              : 'Admin');

  const contentPad = isDesktop
    ? 'lg:pl-72'
    : isTablet
      ? tabletCollapsed
        ? 'md:pl-20'
        : 'md:pl-20'
      : '';

  return (
    <div className="admin-shell-bg no-x-scroll min-h-screen min-h-[100dvh]">
      <AdminSidebar
        open={isMobile ? sidebarOpen : isTablet ? !tabletCollapsed : true}
        collapsed={tabletCollapsed}
        onClose={() => {
          setSidebarOpen(false);
          if (isTablet) setTabletCollapsed(true);
        }}
        onToggleCollapse={() => setTabletCollapsed((prev) => !prev)}
      />
      <div className={contentPad}>
        <AdminTopBar
          title={title}
          onMenuClick={() => {
            if (isMobile) {
              setSidebarOpen(true);
              return;
            }
            if (isTablet) {
              setTabletCollapsed((prev) => !prev);
            }
          }}
        />
        <main className="min-h-[calc(100dvh-5rem)] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
