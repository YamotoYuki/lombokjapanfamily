import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
  children?: ReactNode;
}

/**
 * Section heroes (Family / Gallery / …). Not used by TOP HeroSection.
 * Full-bleed cover so wallpaper fills left–right; HTML titles stay primary via overlays.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-primary-bg public-page-offset">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center top',
        }}
        aria-hidden
      />
      {/* Soft mute for baked-in wallpaper type — keep image readable */}
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

      {/* ~20% shorter vertical padding than previous full hero */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-11 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)] sm:text-xs sm:tracking-[0.3em]">
          {eyebrow}
        </p>
        <h1 className="mt-2 max-w-3xl break-words font-display text-[clamp(1.7rem,6vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:mt-2.5 md:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-2.5 max-w-2xl break-words text-sm leading-relaxed text-white/88 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:mt-3 sm:text-base">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
