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
    <section className="relative overflow-hidden pt-20">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-primary-bg/80 to-primary-bg" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
