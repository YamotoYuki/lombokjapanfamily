import {
  Facebook,
  Instagram,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import { useSettings } from '@/hooks/useSettings';
import type { Settings } from '@/types/settings';

type SocialItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  accentClass: string;
};

function resolveYoutubeUrl(settings?: Settings | null) {
  return (
    settings?.youtube_url?.trim() ||
    settings?.youtube_channel_url?.trim() ||
    ''
  );
}

function buildSocialItems(settings?: Settings | null): SocialItem[] {
  const candidates: Array<Omit<SocialItem, 'href'> & { href?: string }> = [
    {
      id: 'youtube',
      label: 'YouTube',
      href: resolveYoutubeUrl(settings),
      icon: Youtube,
      accentClass:
        'hover:border-youtube-red/50 hover:bg-youtube-red/15 hover:text-youtube-red',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: settings?.instagram_url?.trim(),
      icon: Instagram,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: settings?.tiktok_url?.trim(),
      icon: Music2,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: settings?.facebook_url?.trim(),
      icon: Facebook,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
    {
      id: 'x',
      label: 'X',
      href: settings?.x_url?.trim(),
      icon: Twitter,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
  ];

  return candidates.filter((item): item is SocialItem => Boolean(item.href));
}

export default function OfficialSocialSection() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const socials = buildSocialItems(settings);

  if (socials.length === 0) return null;

  return (
    <section
      id="official-social"
      aria-label={t('home.socialAria')}
      className="relative border-y border-white/5 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0f172a]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-youtube-red/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <FadeIn>
          <SectionHeading
            align="center"
            eyebrow={t('home.socialEyebrow')}
            title={t('home.socialTitle')}
            description={t('home.socialDescription')}
          />
        </FadeIn>

        <FadeIn delayMs={80}>
          <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
            {socials.map(({ id, label, href, icon: Icon, accentClass }) => (
              <li key={id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={[
                    'group flex min-w-[7.5rem] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-muted transition-all',
                    accentClass,
                  ].join(' ')}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#111827] transition-colors group-hover:border-current/30">
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="text-xs font-medium tracking-wide text-white/90">
                    {label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
