interface MfaStatusBadgeProps {
  enabled?: boolean | null;
  className?: string;
}

export default function MfaStatusBadge({
  enabled,
  className = '',
}: MfaStatusBadgeProps) {
  if (enabled === true) {
    return (
      <span
        className={[
          'inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/30',
          className,
        ].join(' ')}
      >
        MFA 有効
      </span>
    );
  }

  if (enabled === false) {
    return (
      <span
        className={[
          'inline-flex items-center rounded-full bg-youtube-red/15 px-2.5 py-0.5 text-[11px] font-medium text-red-200 ring-1 ring-youtube-red/30',
          className,
        ].join(' ')}
      >
        MFA 未設定
      </span>
    );
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-white/15',
        className,
      ].join(' ')}
    >
      MFA —
    </span>
  );
}
