import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = '',
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={[
          'w-full resize-y rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white',
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
