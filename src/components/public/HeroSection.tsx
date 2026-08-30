import { Play, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import {
  BRAND_NAME,
  YOUTUBE_CHANNEL_URL,
  YOUTUBE_SUBSCRIBE_URL,
} from '@/data/brand';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&auto=format';

export default function HeroSection() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const youtubeUrl = settings?.youtube_channel_url || YOUTUBE_CHANNEL_URL;
  const subscribeUrl = youtubeUrl.includes('sub_confirmation')
    ? youtubeUrl
    : `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}sub_confirmation=1`;

  return (
    <section className="hero-viewport relative flex min-h-[70vh] items-end overflow-hidden md:min-h-[85vh] lg:min-h-screen">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          animation: 'hero-pan 28s ease-in-out infinite alternate',
        }}
        role="img"
        aria-label={t('home.heroImageAlt')}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-primary-bg" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-bg/80 via-transparent to-primary-bg/40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-28">
        <p className="animate-fade-up text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs sm:tracking-[0.35em]">
          {t('home.heroEyebrow')}
        </p>
        <h1 className="animate-fade-up mt-4 max-w-4xl font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-white delay-100 sm:mt-5 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
          <span className="text-youtube-red">Lombok</span>
          <span className="text-white">-Japan </span>
          <span className="text-gold">Family</span>
        </h1>
        <p className="animate-fade-up mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/90 delay-200 sm:mt-5 sm:text-xl">
          {t('home.heroTagline')}
        </p>
        <p className="animate-fade-up mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-white/75 delay-200 sm:text-base">
          {t('home.heroDescription')}
        </p>

        <div className="animate-fade-up mt-6 flex flex-col gap-3 delay-300 xs:flex-row sm:mt-8 sm:flex-row sm:flex-wrap">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-youtube-red/30 transition-all hover:-translate-y-0.5 hover:bg-red-600"
          >
            <Youtube size={18} aria-hidden />
            {t('home.ctaWatch')}
          </a>
          <a
            href={subscribeUrl || YOUTUBE_SUBSCRIBE_URL}
            target="_blank"
            rel="noreferrer"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/20"
          >
            {t('home.ctaSubscribe')}
          </a>
        </div>

        <a
          href="#channel-stats"
          className="animate-fade-up mt-8 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60 transition-colors delay-700 hover:text-gold sm:mt-10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
            <Play size={12} fill="currentColor" aria-hidden />
          </span>
          {t('common.scroll')}
        </a>
      </div>

      <span className="sr-only">{BRAND_NAME}</span>
    </section>
  );
}
