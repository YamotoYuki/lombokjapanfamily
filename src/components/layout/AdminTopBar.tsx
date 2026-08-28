import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface AdminTopBarProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function AdminTopBar({
  title = 'Admin',
  onMenuClick,
}: AdminTopBarProps) {
  const { profile, role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.display_name ?? user?.email ?? 'Administrator';
  const initials =
    profile?.display_name?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    'AD';

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-primary-bg/75 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center rounded-2xl border border-white/10 p-2.5 text-muted transition-colors hover:text-white lg:hidden"
            onClick={onMenuClick}
            aria-label="メニューを開く"
            aria-controls="admin-sidebar"
            aria-expanded={undefined}
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
              {title}
            </h1>
            <p className="truncate text-xs text-muted">
              Lombok-Japan Family CMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden w-64 md:block xl:w-80">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              type="search"
              placeholder="動画・記事・案件を検索..."
              aria-label="Search"
              className="!rounded-2xl !pl-9"
            />
          </div>

          <button
            type="button"
            className="relative rounded-2xl border border-white/10 p-2.5 text-muted transition-all hover:border-gold/40 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-youtube-red" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-youtube-red to-amber-600 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-xs font-medium text-white">
                  {displayName}
                </p>
                <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-gold">
                  <Shield size={10} />
                  {role ?? 'member'}
                </p>
              </div>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl"
              >
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="truncate text-sm text-white">{displayName}</p>
                  <p className="truncate text-xs text-muted">
                    {user?.email ?? 'admin@example.com'}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-youtube-red/15 hover:text-white"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
