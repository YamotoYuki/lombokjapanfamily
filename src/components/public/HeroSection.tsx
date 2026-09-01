import { Play, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import {
  BRAND_NAME,
  YOUTUBE_CHANNEL_URL,
  YOUTUBE_SUBSCRIBE_URL,
} from '@/data/brand';
import { PAGE_IMAGES } from '@/data/pageImages';

export default function HeroSection() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const youtubeUrl = settings?.youtube_channel_url || YOUTUBE_CHANNEL_URL;
  const subscribeUrl = youtubeUrl.includes('sub_confirmation')
    ? youtubeUrl
    : `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}sub_confirmation=1`;

  return (
    <section className="hero-viewport relative flex min-h-[70vh] items-center overflow-hidden md:min-h-[85vh] lg:min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform motion-safe:animate-hero-pan"
        style={{ backgroundImage: `url(${PAGE_IMAGES.homeHero})` }}
        role="img"
        aria-label={t('home.heroImageAlt')}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-primary-bg"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary-bg/45 via-transparent to-primary-bg/25"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
        <p className="animate-fade-up text-[10px] font-medium uppercase tracking-[0.28em] text-gold drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:text-sm sm:tracking-[0.35em]">
          {t('home.heroEyebrow')}
        </p>
        <h1 className="animate-fade-up mt-3 max-w-4xl break-words font-display text-[clamp(1.85rem,9vw,2.35rem)] font-semibold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] delay-100 sm:mt-5 sm:text-6xl sm:leading-[1.08] lg:text-7xl">
          <span className="text-youtube-red">Lombok</span>
          <span className="text-white">-Japan </span>
          <span className="text-gold">Family</span>
        </h1>
        <p className="animate-fade-up mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] delay-200 sm:mt-6 sm:text-2xl">
          {t('home.heroTagline')}
        </p>
        <p className="animate-fade-up mt-4 max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] delay-200 sm:text-lg">
          {t('home.heroDescription')}
        </p>

        <div className="animate-fade-up mt-7 flex w-full max-w-md flex-col gap-3 delay-300 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-youtube-red px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-youtube-red/30 transition-all hover:-translate-y-0.5 hover:bg-red-600 sm:w-auto"
          >
            <Youtube size={20} aria-hidden />
            {t('home.ctaWatch')}
          </a>
          <a
            href={subscribeUrl || YOUTUBE_SUBSCRIBE_URL}
            target="_blank"
            rel="noreferrer"
            className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-6 py-3.5 text-base font-semibold text-gold backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/20 sm:w-auto"
          >
            {t('home.ctaSubscribe')}
          </a>
        </div>

        <a
          href="#channel-stats"
          className="animate-fade-up mt-10 inline-flex min-h-11 items-center gap-2.5 text-sm uppercase tracking-[0.24em] text-white/70 transition-colors delay-700 hover:text-gold sm:mt-12"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
            <Play size={14} fill="currentColor" aria-hidden />
          </span>
          {t('common.scroll')}
        </a>
      </div>

      <span className="sr-only">{BRAND_NAME}</span>
    </section>
  );
}
