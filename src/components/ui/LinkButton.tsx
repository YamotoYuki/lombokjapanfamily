import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import type { ButtonSize, ButtonVariant } from '@/components/ui/Button';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-youtube-red text-white hover:bg-red-700 focus-visible:ring-youtube-red',
  secondary:
    'bg-gold text-primary-bg hover:bg-amber-500 focus-visible:ring-gold',
  ghost:
    'bg-transparent text-white border border-border hover:bg-surface focus-visible:ring-muted',
  danger:
    'bg-red-900/60 text-white hover:bg-red-800 focus-visible:ring-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-2 text-sm rounded-xl',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-2xl',
  lg: 'min-h-12 px-5 py-3 text-base rounded-2xl',
};

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return [
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-bg',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');
}

/** Public/admin shared “一覧へ戻る” control */
export const backLinkClassName =
  'touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50';

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

/** Single-element button-styled link (avoids invalid Link > button nesting). */
export default function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link {...props} className={buttonClassName(variant, size, className)}>
      {children}
    </Link>
  );
}
