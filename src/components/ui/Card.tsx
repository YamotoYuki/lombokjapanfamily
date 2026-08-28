import type { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  glass = true,
  hoverable = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl p-5 transition-all duration-300',
        glass ? 'glass' : 'border border-border bg-surface',
        hoverable
          ? 'hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_22px_60px_rgba(0,0,0,0.45)]'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
