import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { useActiveNotificationBanner } from '@/hooks/useNotificationBanners';
import {
  localizedBannerMessage,
  localizedBannerTitle,
} from '@/types/notificationBanner';

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export default function NotificationBanner() {
  const { t, i18n } = useTranslation();
  const query = useActiveNotificationBanner();
  const banner = query.data;

  if (query.isLoading || !banner) return null;

  const title = localizedBannerTitle(banner, i18n.language);
  const message = localizedBannerMessage(banner, i18n.language);
  if (!title && !message) return null;

  const linkUrl = banner.link_url?.trim() || '';
  const ctaLabel = t('home.notificationBannerCta');

  return (
    <section
      aria-label={t('home.notificationBannerAria')}
      className="relative border-b border-youtube-red/30 bg-gradient-to-r from-[#111827] via-[#1a1220] to-[#111827]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <FadeIn>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-youtube-red/40 bg-youtube-red/15 text-youtube-red">
                <Megaphone size={18} aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                {title ? (
                  <p className="break-words text-sm font-semibold text-white sm:text-base">
                    {title}
                  </p>
                ) : null}
                {message ? (
                  <p className="break-words text-sm leading-relaxed text-muted">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>
            {linkUrl ? (
              isExternalUrl(linkUrl) ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="touch-target inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 text-sm font-medium text-gold transition hover:bg-gold/20 sm:w-auto sm:justify-start sm:border-0 sm:bg-transparent sm:px-0"
                >
                  {ctaLabel}
                  <ArrowRight size={14} aria-hidden />
                </a>
              ) : (
                <Link
                  to={linkUrl}
                  className="touch-target inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 text-sm font-medium text-gold transition hover:bg-gold/20 sm:w-auto sm:justify-start sm:border-0 sm:bg-transparent sm:px-0"
                >
                  {ctaLabel}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              )
            ) : null}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
