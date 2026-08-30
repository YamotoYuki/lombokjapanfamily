import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import { useSettings } from '@/hooks/useSettings';
import { getOfficialSocialLinks } from '@/lib/officialSocial';

export default function OfficialSocialSection() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  // Four primary platforms in one even row (YouTube / Instagram / TikTok / Facebook).
  const socials = getOfficialSocialLinks(settings, { includeX: false }).slice(
    0,
    4,
  );

  if (socials.length === 0) return null;

  return (
    <section
      id="official-social"
      aria-label={t('home.socialAria')}
      className="relative border-y border-white/5 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0f172a]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-youtube-red/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <FadeIn>
          <SectionHeading
            align="center"
            eyebrow={t('home.socialEyebrow')}
            title={t('home.socialTitle')}
            description={t('home.socialDescription')}
          />
        </FadeIn>

        <FadeIn delayMs={80}>
          <ul className="mx-auto grid w-full max-w-4xl grid-cols-4 gap-2 sm:gap-4">
            {socials.map(({ id, label, href, icon: Icon, accentClass }) => (
              <li key={id} className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={[
                    'group flex h-full min-h-11 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-1.5 py-3 text-muted transition-all sm:gap-2.5 sm:px-4 sm:py-5',
                    accentClass,
                  ].join(' ')}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#111827] transition-colors group-hover:border-current/30 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </span>
                  <span className="max-w-full truncate text-center text-[10px] font-medium tracking-wide text-white/90 sm:text-xs">
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
