interface VideoStatusBadgeProps {
  label: string;
  tone?: 'red' | 'gold' | 'green' | 'muted';
}

const toneClass = {
  red: 'bg-youtube-red/15 text-youtube-red ring-youtube-red/30',
  gold: 'bg-gold/15 text-gold ring-gold/30',
  green: 'bg-success/15 text-success ring-success/30',
  muted: 'bg-white/10 text-muted ring-white/10',
} as const;

export default function VideoStatusBadge({
  label,
  tone = 'muted',
}: VideoStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        toneClass[tone],
      ].join(' ')}
    >
      {label}
    </span>
  );
}
