import { useEffect, useRef, useState } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContacts } from '@/hooks/useContacts';
import { useContactStats } from '@/hooks/useContactStats';
import { formatContactDate } from '@/types/contact';

/**
 * TopBar contact notifications: status=new only.
 * Badge + list hide when new_count is 0 (no separate read state).
 */
export default function ContactNotificationBell() {
  const { t, i18n } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'editor');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const locale = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);

  const statsQuery = useContactStats(canManage);
  const newCount = statsQuery.data?.new_count ?? 0;
  const hasNew = newCount > 0;

  const listQuery = useContacts(
    { status: 'new', page: 1, limit: 8 },
    canManage && (open || hasNew),
  );
  const items = listQuery.data?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!canManage) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="touch-target relative inline-flex items-center gap-1.5 rounded-2xl border border-white/10 px-2.5 py-2.5 text-muted transition-all hover:border-gold/40 hover:text-white sm:px-3"
        aria-label={t('admin.notifications')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={18} aria-hidden />
        {hasNew ? (
          <span className="min-w-[1.25rem] rounded-full bg-youtube-red px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
            {newCount > 99 ? '99+' : newCount.toLocaleString(locale)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
            <p className="text-sm font-medium text-white">
              {t('admin.notifications')}
            </p>
            {hasNew ? (
              <span className="text-[11px] text-gold">
                {t('admin.pendingCount', {
                  count: newCount.toLocaleString(locale),
                })}
              </span>
            ) : null}
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-1.5">
            {!hasNew ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                {t('admin.noNotifications')}
              </p>
            ) : listQuery.isLoading ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                {t('admin.common.loading')}
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                {t('admin.noNotifications')}
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      to={`/admin/contact/${contact.id}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <MessageSquare
                        size={16}
                        className="mt-0.5 shrink-0 text-gold"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {contact.subject || t('admin.common.untitled')}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {contact.contact_name}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted/80">
                          {formatContactDate(contact.created_at, locale)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasNew ? (
            <div className="border-t border-white/10 p-1.5">
              <Link
                to="/admin/contact?status=new"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-gold transition-colors hover:bg-white/5"
              >
                {t('admin.viewAllNewContacts')}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
