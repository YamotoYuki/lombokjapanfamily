import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/public/LanguageSwitcher';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

const navKeys = [
  { to: '/', key: 'home' },
  { to: '/videos', key: 'videos' },
  { to: '/family', key: 'family' },
  { to: '/announcements', key: 'announcements' },
  { to: '/blog', key: 'blog' },
  { to: '/gallery', key: 'gallery' },
  { to: '/contact', key: 'contact' },
] as const;

interface SiteHeaderProps {
  settings?: Settings | null;
}

function BrandMark({ settings }: { settings?: Settings | null }) {
  const name = settings?.site_name || DEFAULT_SETTINGS.site_name;
  if (settings?.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt={name}
        className="h-10 w-auto max-w-[200px] object-contain md:h-11"
      />
    );
  }

  const parts = name.split(/(-)/);
  return (
    <span className="font-display text-xl font-semibold tracking-tight md:text-2xl">
      {parts.map((part, index) => {
        if (part.toLowerCase().includes('lombok')) {
          return (
            <span key={index} className="text-youtube-red">
              {part}
            </span>
          );
        }
        if (part.toLowerCase().includes('family')) {
          return (
            <span key={index} className="text-gold">
              {part}
            </span>
          );
        }
        return (
          <span key={index} className="text-white">
            {part}
          </span>
        );
      })}
    </span>
  );
}

export default function SiteHeader({ settings }: SiteHeaderProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const youtubeUrl =
    settings?.youtube_channel_url ||
    DEFAULT_SETTINGS.youtube_channel_url ||
    undefined;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled || open
          ? 'border-b border-white/10 bg-primary-bg/90 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl'
          : 'bg-gradient-to-b from-black/70 to-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="relative z-10 min-w-0" onClick={() => setOpen(false)}>
          <span className="block text-[10px] uppercase tracking-[0.3em] text-gold">
            {t('nav.officialChannel')}
          </span>
          <BrandMark settings={settings} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navKeys.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'text-sm font-medium tracking-wide transition-colors',
                  isActive ? 'text-gold' : 'text-white/75 hover:text-white',
                ].join(' ')
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
          {youtubeUrl ? (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-white/75 transition-colors hover:text-youtube-red"
            >
              {t('nav.youtube')}
            </a>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          {youtubeUrl ? (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-2xl bg-youtube-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-youtube-red/30 transition-all hover:-translate-y-0.5 hover:bg-red-600 sm:inline-flex"
            >
              <Youtube size={16} />
              {t('nav.youtube')}
            </a>
          ) : null}
          <button
            type="button"
            className="touch-target rounded-2xl border border-white/15 p-2.5 text-white lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={[
          'border-t border-white/10 bg-primary-bg/95 backdrop-blur-xl lg:hidden',
          open ? 'block' : 'hidden',
        ].join(' ')}
      >
        <div className="space-y-1 px-4 py-4">
          {navKeys.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'block rounded-2xl px-4 py-3 text-sm font-medium',
                  isActive
                    ? 'bg-youtube-red/15 text-gold'
                    : 'text-white/80 hover:bg-white/5',
                ].join(' ')
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
          {youtubeUrl ? (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-youtube-red px-4 py-3 text-sm font-semibold text-white"
            >
              <Youtube size={16} />
              {t('nav.watchYoutube')}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
