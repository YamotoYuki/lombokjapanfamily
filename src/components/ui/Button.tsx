import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

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

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-bg',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
