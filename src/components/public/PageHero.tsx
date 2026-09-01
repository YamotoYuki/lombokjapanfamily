import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
  children?: ReactNode;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden public-page-offset">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-primary-bg"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs sm:tracking-[0.3em]">
          {eyebrow}
        </p>
        <h1 className="mt-2.5 max-w-3xl break-words font-display text-[clamp(1.75rem,6.5vw,3rem)] font-semibold leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:mt-3 md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:mt-4 sm:text-base">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
