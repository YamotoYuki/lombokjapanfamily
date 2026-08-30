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
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-primary-bg/80 to-primary-bg" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs sm:tracking-[0.3em]">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl break-words font-display text-3xl font-semibold tracking-tight text-white sm:mt-4 sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-white/75 sm:mt-4 md:text-base">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
