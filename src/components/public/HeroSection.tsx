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
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${PAGE_IMAGES.homeHero})`,
          backgroundPosition: 'center top',
        }}
        role="img"
        aria-label={t('home.heroImageAlt')}
      />
      {/* Match PageHero overlays — soft mute, image stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 36%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 50%, transparent 72%)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/10" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-primary-bg/35 to-primary-bg"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="w-full max-w-xl text-left sm:max-w-2xl">
          <h1 className="animate-fade-up break-words font-display text-[clamp(1.85rem,8vw,2.5rem)] font-semibold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:text-5xl sm:leading-[1.08] lg:text-6xl">
            <span className="text-youtube-red">Lombok</span>
            <span className="text-white">-Japan </span>
            <span className="text-gold">Family</span>
          </h1>

          <p className="animate-fade-up mt-4 text-base font-medium leading-relaxed text-white/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] delay-100 sm:mt-5 sm:text-xl lg:text-2xl">
            {t('home.heroTagline')}
          </p>
          <p className="animate-fade-up mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] delay-200 sm:mt-4 sm:text-base lg:text-lg">
            {t('home.heroDescription')}
          </p>

          <div className="animate-fade-up mt-7 flex w-full max-w-md flex-col gap-3 delay-300 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap">
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
            className="animate-fade-up mt-8 inline-flex min-h-11 items-center gap-2.5 text-sm uppercase tracking-[0.24em] text-white/70 transition-colors delay-500 hover:text-gold sm:mt-10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
              <Play size={14} fill="currentColor" aria-hidden />
            </span>
            {t('common.scroll')}
          </a>
        </div>
      </div>

      <span className="sr-only">{BRAND_NAME}</span>
    </section>
  );
}
