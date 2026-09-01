import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { restorePublicLanguage } from '@/i18n';

const titleKeyMap: Record<string, string> = {
  '/admin': 'admin.titles.dashboard',
  '/admin/dashboard': 'admin.titles.dashboard',
  '/admin/videos': 'admin.titles.videos',
  '/admin/blog': 'admin.titles.blog',
  '/admin/blog/new': 'admin.titles.blogCreate',
  '/admin/blog/categories': 'admin.titles.blogCategories',
  '/admin/gallery': 'admin.titles.gallery',
  '/admin/gallery/new': 'admin.titles.galleryCreate',
  '/admin/gallery/categories': 'admin.titles.galleryCategories',
  '/admin/contact': 'admin.titles.contact',
  '/admin/family': 'admin.titles.family',
  '/admin/family/new': 'admin.titles.familyCreate',
  '/admin/announcements': 'admin.titles.announcements',
  '/admin/announcements/new': 'admin.titles.announcementCreate',
  '/admin/notification-banners': 'admin.titles.notificationBanners',
  '/admin/notification-banners/new': 'admin.titles.bannerCreate',
  '/admin/sponsors': 'admin.titles.sponsors',
  '/admin/sponsors/new': 'admin.titles.sponsorCreate',
  '/admin/analytics': 'admin.titles.analytics',
  '/admin/users': 'admin.titles.users',
  '/admin/account': 'admin.titles.account',
  '/admin/profile': 'admin.titles.account',
  '/admin/settings': 'admin.titles.settings',
};

function resolveAdminTitleKey(pathname: string) {
  if (titleKeyMap[pathname]) return titleKeyMap[pathname];
  if (pathname.match(/\/admin\/videos\/[^/]+\/edit$/)) return 'admin.titles.videoEdit';
  if (pathname.match(/\/admin\/blog\/[^/]+\/edit$/)) return 'admin.titles.blogEdit';
  if (pathname.match(/\/admin\/gallery\/[^/]+\/edit$/)) {
    return 'admin.titles.galleryEdit';
  }
  if (pathname.match(/\/admin\/family\/[^/]+\/edit$/)) return 'admin.titles.familyEdit';
  if (pathname.match(/\/admin\/announcements\/[^/]+\/edit$/)) {
    return 'admin.titles.announcementEdit';
  }
  if (pathname.match(/\/admin\/notification-banners\/[^/]+\/edit$/)) {
    return 'admin.titles.bannerEdit';
  }
  if (pathname.match(/\/admin\/contact\/[^/]+\/edit$/)) {
    return 'admin.titles.contactEdit';
  }
  if (pathname.match(/\/admin\/contact\/[^/]+$/)) return 'admin.titles.contactDetail';
  if (pathname.match(/\/admin\/users\/[^/]+\/edit$/)) return 'admin.titles.userEdit';
  if (pathname.match(/\/admin\/sponsors\/[^/]+\/edit$/)) {
    return 'admin.titles.sponsorEdit';
  }
  if (pathname.match(/\/admin\/sponsors\/[^/]+$/)) return 'admin.titles.sponsorDetail';
  return 'admin.titles.admin';
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isDesktop, isTablet, isMobile } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabletCollapsed, setTabletCollapsed] = useState(true);

  useEffect(() => {
    void restorePublicLanguage();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    if (isTablet) setTabletCollapsed(true);
  }, [pathname, isTablet]);

  const title = t(resolveAdminTitleKey(pathname));

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
        <main className="min-h-[calc(100dvh-5rem)] px-3 py-4 pb-8 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
