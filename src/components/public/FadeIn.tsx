import type { ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export default function FadeIn({
  children,
  className = '',
  delayMs = 0,
}: FadeInProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={[
        'transition-all duration-700 ease-out',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      ].join(' ')}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
