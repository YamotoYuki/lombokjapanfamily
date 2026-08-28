import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={[
        'mb-10 flex flex-col gap-4 md:mb-12',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
      ].join(' ')}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-3xl'}>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
