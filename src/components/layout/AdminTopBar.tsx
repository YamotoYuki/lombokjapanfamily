import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContactStats } from '@/hooks/useContactStats';

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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const contactStats = useContactStats();

  const displayName = profile?.display_name ?? user?.email ?? 'Administrator';
  const initials =
    profile?.display_name?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    'AD';

  const newContacts = contactStats.data?.new_count ?? 0;
  const hasBadge = newContacts > 0;

  useEffect(() => {
    if (!notifOpen && !menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifOpen && !notifRef.current?.contains(target)) {
        setNotifOpen(false);
      }
      if (menuOpen && !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notifOpen, menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    setNotifOpen(false);
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
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="relative rounded-2xl border border-white/10 p-2.5 text-muted transition-all hover:border-gold/40 hover:text-white"
              aria-label="通知"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              onClick={() => {
                setMenuOpen(false);
                setNotifOpen((prev) => !prev);
              }}
            >
              <Bell size={18} />
              {hasBadge ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-youtube-red" />
              ) : null}
            </button>

            {notifOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl"
              >
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="text-sm font-medium text-white">通知</p>
                  <p className="text-xs text-muted">
                    お問い合わせ・お知らせのショートカット
                  </p>
                </div>
                <Link
                  to="/admin/contact"
                  role="menuitem"
                  onClick={() => setNotifOpen(false)}
                  className="mt-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <MessageSquare
                    size={16}
                    className="mt-0.5 shrink-0 text-gold"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-white">
                      お問い合わせ
                    </span>
                    <span className="block text-xs text-muted">
                      {hasBadge
                        ? `未対応 ${newContacts.toLocaleString('ja-JP')} 件`
                        : '一覧を確認する'}
                    </span>
                  </span>
                </Link>
                <Link
                  to="/admin/announcements"
                  role="menuitem"
                  onClick={() => setNotifOpen(false)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <Megaphone size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span className="min-w-0">
                    <span className="block text-sm text-white">お知らせ</span>
                    <span className="block text-xs text-muted">
                      公開中のお知らせを管理
                    </span>
                  </span>
                </Link>
                <Link
                  to="/admin/notification-banners"
                  role="menuitem"
                  onClick={() => setNotifOpen(false)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <Bell size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span className="min-w-0">
                    <span className="block text-sm text-white">
                      TOP通知バナー
                    </span>
                    <span className="block text-xs text-muted">
                      トップ表示バナーを管理
                    </span>
                  </span>
                </Link>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setMenuOpen((prev) => !prev);
              }}
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
