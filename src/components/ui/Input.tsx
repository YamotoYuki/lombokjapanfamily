import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white',
          'placeholder:text-muted/70',
          'focus:border-youtube-red focus:outline-none focus:ring-1 focus:ring-youtube-red',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
