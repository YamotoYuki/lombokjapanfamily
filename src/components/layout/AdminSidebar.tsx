import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Newspaper,
  Images,
  Mail,
  Users,
  Handshake,
  BarChart3,
  UserCog,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { sidebarAllowed } from '@/lib/rbac';

interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/videos', label: 'Videos', icon: Video },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/contact', label: 'Contact', icon: Mail },
  { to: '/admin/family', label: 'Family', icon: Users },
  { to: '/admin/sponsors', label: 'Sponsors', icon: Handshake },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({
  open = false,
  collapsed = true,
  onClose,
  onToggleCollapse,
}: AdminSidebarProps) {
  const { role } = useAuth();
  const { isDesktop, isTablet, isMobile } = useBreakpoint();
  const visibleItems = sidebarItems.filter((item) =>
    sidebarAllowed(role, item.to),
  );

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!isMobile || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, open]);

  const showLabels = isDesktop || (isMobile && open) || (isTablet && !collapsed);
  const tabletCollapsed = isTablet && collapsed;

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity lg:hidden',
          open || (isTablet && !collapsed)
            ? 'opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden={!(open || (isTablet && !collapsed))}
      />

      <aside
        id="admin-sidebar"
        aria-label="管理メニュー"
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-primary-bg/95 backdrop-blur-xl transition-all duration-300',
          // Mobile drawer
          isMobile
            ? open
              ? 'w-72 translate-x-0'
              : 'w-72 -translate-x-full'
            : '',
          // Tablet rail / expanded
          isTablet
            ? tabletCollapsed
              ? 'w-20 translate-x-0'
              : 'w-72 translate-x-0 shadow-2xl'
            : '',
          // Desktop full
          isDesktop ? 'w-72 translate-x-0' : '',
          !isMobile && !isTablet && !isDesktop ? 'w-72 -translate-x-full' : '',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-20 items-center border-b border-white/10 px-3',
            showLabels ? 'justify-between px-5' : 'justify-center',
          ].join(' ')}
        >
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={showLabels ? 'leading-tight' : 'sr-only'}
          >
            <span className="block text-[11px] uppercase tracking-[0.22em] text-gold">
              Official CMS
            </span>
            <span className="mt-1 block text-base font-semibold">
              <span className="text-youtube-red">Lombok</span>
              <span className="text-white">-Japan </span>
              <span className="text-gold">Family</span>
            </span>
          </NavLink>

          {!showLabels && (
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-youtube-red/15 text-sm font-bold text-youtube-red"
              aria-hidden
            >
              LJ
            </span>
          )}

          <div className="flex items-center gap-1">
            {isTablet && onToggleCollapse ? (
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-muted transition-colors hover:text-white"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            ) : null}
            <button
              type="button"
              className="touch-target inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-muted transition-colors hover:text-white lg:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2 py-4 md:px-3">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={label}
              className={({ isActive }) =>
                [
                  'group touch-target flex items-center gap-3 rounded-2xl text-sm transition-all duration-300',
                  showLabels ? 'px-3.5 py-3' : 'justify-center px-2 py-3',
                  isActive
                    ? 'bg-gradient-to-r from-youtube-red/25 to-youtube-red/5 text-white shadow-[0_10px_30px_rgba(220,38,38,0.18)] ring-1 ring-youtube-red/40'
                    : 'text-muted hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                      isActive
                        ? 'bg-youtube-red/20 text-youtube-red'
                        : 'bg-white/5 text-muted group-hover:text-white',
                    ].join(' ')}
                  >
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                  </span>
                  {showLabels ? (
                    <span className="font-medium">{label}</span>
                  ) : (
                    <span className="sr-only">{label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={[
            'border-t border-white/10 py-4',
            showLabels ? 'px-5' : 'px-2 text-center',
          ].join(' ')}
        >
          {showLabels ? (
            <>
              <p className="text-xs text-muted">Signed in as</p>
              <p className="mt-1 text-sm font-medium uppercase text-white">
                {role ?? '—'}
              </p>
            </>
          ) : (
            <p className="text-[10px] uppercase tracking-wide text-gold">
              {role?.slice(0, 3) ?? '—'}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
