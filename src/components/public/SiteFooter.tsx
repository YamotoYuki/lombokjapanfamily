import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/videos', label: 'Videos' },
  { to: '/family', label: 'Family' },
  { to: '/blog', label: 'Blog' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

interface SiteFooterProps {
  settings?: Settings | null;
}

export default function SiteFooter({ settings }: SiteFooterProps) {
  const siteName = settings?.site_name || DEFAULT_SETTINGS.site_name;
  const description =
    settings?.site_description || DEFAULT_SETTINGS.site_description;

  const socials = [
    {
      label: 'YouTube',
      href: settings?.youtube_channel_url,
      icon: Youtube,
    },
    {
      label: 'Instagram',
      href: settings?.instagram_url,
      icon: Instagram,
    },
    {
      label: 'TikTok',
      href: settings?.tiktok_url,
      icon: Music2,
    },
    {
      label: 'Facebook',
      href: settings?.facebook_url,
      icon: Facebook,
    },
    {
      label: 'X',
      href: settings?.x_url,
      icon: Twitter,
    },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-[#0b1220]">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-youtube-red/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
            Official Website
          </p>
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={siteName}
              className="mt-4 h-12 w-auto max-w-[220px] object-contain"
            />
          ) : (
            <p className="mt-3 font-display text-2xl font-semibold text-white">
              {siteName}
            </p>
          )}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {description}
          </p>
          {socials.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted transition-all hover:border-youtube-red/40 hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Menu</p>
          <ul className="mt-4 space-y-2">
            {footerLinks.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
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
              <li>
                コラボ・取材・スポンサーのご相談は Contact ページよりどうぞ。
              </li>
            ) : null}
          </ul>
          <Link
            to="/contact"
            className="mt-5 inline-flex rounded-2xl border border-gold/40 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/10"
          >
            Contact Us
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p>Japan × Indonesia Family Channel</p>
        </div>
      </div>
    </footer>
  );
}
