import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { getOfficialSocialLinks } from '@/lib/officialSocial';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

const footerKeys = [
  { to: '/', key: 'home' },
  { to: '/videos', key: 'videos' },
  { to: '/family', key: 'family' },
  { to: '/announcements', key: 'announcements' },
  { to: '/blog', key: 'blog' },
  { to: '/gallery', key: 'gallery' },
  { to: '/contact', key: 'contact' },
] as const;

interface SiteFooterProps {
  settings?: Settings | null;
}

function footerDescription(raw: string) {
  return raw.replace(/\s+and\s+CMS\b/gi, '').trim();
}

export default function SiteFooter({ settings }: SiteFooterProps) {
  const { t, i18n } = useTranslation();
  const siteName = settings?.site_name || DEFAULT_SETTINGS.site_name;
  const lang = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);
  const description = footerDescription(
    lang === 'ja'
      ? settings?.site_description ||
          t('seo.homeDescription') ||
          DEFAULT_SETTINGS.site_description
      : t('seo.homeDescription'),
  );

  const socials = getOfficialSocialLinks(settings);

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-[#0b1220]">
      {/* Ambient brand-color glow so the footer reads as a deliberate closing
          section instead of a flat solid-color bar — echoes the layered
          radial gradients PageHero already uses elsewhere on the site. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70"
        style={{
          background:
            'radial-gradient(55% 100% at 12% 0%, rgba(212,175,55,0.12) 0%, transparent 65%), radial-gradient(45% 100% at 88% 0%, rgba(229,9,20,0.10) 0%, transparent 65%)',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-youtube-red/60 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 lg:px-8">
        <FadeIn className="col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
            {t('footer.officialWebsite')}
          </p>
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={siteName}
              className="mt-4 h-12 w-auto max-w-[220px] object-contain"
            />
          ) : (
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-2xl">
              {siteName}
            </p>
          )}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {description}
          </p>
          {socials.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map(({ id, label, href, icon: Icon, accentClass }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={[
                    'group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.4)]',
                    accentClass,
                  ].join(' ')}
                >
                  <Icon
                    size={19}
                    aria-hidden
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </a>
              ))}
            </div>
          ) : null}
        </FadeIn>

        <FadeIn delayMs={100}>
          <p className="text-sm font-semibold text-white">{t('footer.menu')}</p>
          <span className="mt-2 block h-[2px] w-8 rounded-full bg-gold/70" aria-hidden />
          <ul className="mt-5 space-y-2.5">
            {footerKeys.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-gold"
                >
                  <span
                    className="h-1 w-1 shrink-0 rounded-full bg-gold/0 transition-all duration-300 group-hover:w-3 group-hover:bg-gold"
                    aria-hidden
                  />
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn delayMs={200} className="col-span-2 md:col-span-1">
          <p className="text-sm font-semibold text-white">
            {t('footer.contact')}
          </p>
          <span className="mt-2 block h-[2px] w-8 rounded-full bg-gold/70" aria-hidden />
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {settings?.contact_email ? (
              <li className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5 shrink-0 text-gold" />
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="hover:text-white"
                >
                  {settings.contact_email}
                </a>
              </li>
            ) : null}
            {settings?.contact_phone ? (
              <li className="flex items-start gap-2">
                <Phone size={14} className="mt-0.5 shrink-0 text-gold" />
                <span>{settings.contact_phone}</span>
              </li>
            ) : null}
            {settings?.contact_address ? (
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-gold" />
                <span className="whitespace-pre-line">
                  {settings.contact_address}
                </span>
              </li>
            ) : null}
            {!settings?.contact_email &&
            !settings?.contact_phone &&
            !settings?.contact_address ? (
              <li>{t('footer.contactFallback')}</li>
            ) : null}
          </ul>
          <Link
            to="/contact"
            className="group mt-5 inline-flex items-center gap-2 rounded-2xl border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/10 hover:shadow-[0_10px_28px_rgba(212,175,55,0.18)]"
          >
            {t('footer.contactCta')}
            <ArrowUpRight
              size={14}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </FadeIn>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteName}. {t('footer.rights')}
          </p>
          <p>{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
