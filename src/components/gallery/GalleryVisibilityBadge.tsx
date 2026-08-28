interface GalleryVisibilityBadgeProps {
  visible: boolean;
}

export default function GalleryVisibilityBadge({
  visible,
}: GalleryVisibilityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
        visible ? 'bg-success/15 text-success' : 'bg-white/10 text-muted',
      ].join(' ')}
    >
      {visible ? '公開中' : '非表示'}
    </span>
  );
}
