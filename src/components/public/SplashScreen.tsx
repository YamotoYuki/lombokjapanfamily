import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '@/data/brand';

const SPLASH_STORAGE_KEY = 'splash_seen';
const SPLASH_DURATION_MS = 3000;
const SPLASH_EXIT_START_MS = 2500;
const SPLASH_REDUCED_MS = 900;

function readSplashSeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_STORAGE_KEY, 'true');
  } catch {
    // ignore
  }
}

/**
 * First-visit splash aligned with public design system
 * (dark theme, glass, YouTube red + gold, Hero typography).
 * CSS-only — no photo/video (LCP-safe).
 */
export default function SplashScreen() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !readSplashSeen());
  const [exiting, setExiting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    setReduced(reduceMotion);

    const duration = reduceMotion ? SPLASH_REDUCED_MS : SPLASH_DURATION_MS;
    const exitAt = reduceMotion
      ? Math.max(0, duration - 200)
      : SPLASH_EXIT_START_MS;

    const exitTimer = window.setTimeout(() => setExiting(true), exitAt);
    const doneTimer = window.setTimeout(() => {
      markSplashSeen();
      setVisible(false);
    }, duration);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={[
        'splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center px-4',
        exiting ? 'splash-screen--exit' : 'splash-screen--enter',
        reduced ? 'splash-screen--reduced' : '',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={t('splash.loading')}
    >
      {/* Hero-aligned dark atmosphere (gradients only — no image) */}
      <div className="splash-atmosphere pointer-events-none absolute inset-0" aria-hidden />

      <div className="splash-panel glass relative z-10 mx-auto w-full max-w-lg rounded-[1.75rem] px-6 py-10 text-center sm:px-10 sm:py-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs sm:tracking-[0.32em]">
          Official Channel
        </p>

        <h1 className="mt-4 break-words font-display text-[clamp(1.85rem,7vw,2.75rem)] font-semibold leading-[1.12] tracking-tight">
          <span className="text-youtube-red">Lombok</span>
          <span className="text-white">-Japan </span>
          <span className="text-gold">Family</span>
        </h1>
        <span className="sr-only">{BRAND_NAME}</span>

        <p className="mt-4 break-words text-sm font-medium leading-relaxed text-white/80 sm:text-base">
          {t('splash.tagline')}
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-[240px] flex-col items-center sm:max-w-[280px]">
          <p className="splash-loading m-0 text-sm tracking-[0.1em] text-white/70">
            {t('splash.loadingBase')}
            <span className="splash-loading-dots" aria-hidden="true" />
          </p>
          <div
            className="splash-progress mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/10"
            aria-hidden="true"
          >
            <div className="splash-progress-bar h-full w-0 rounded-full" />
          </div>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-0 px-4 pb-[max(1.25rem,calc(var(--safe-bottom)+0.5rem))] text-center text-[10px] font-medium uppercase tracking-[0.28em] text-gold/80 sm:text-[11px] sm:tracking-[0.32em]">
        {t('splash.footer')}
      </p>
    </div>
  );
}
