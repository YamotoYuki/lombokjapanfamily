interface GalleryFeaturedBadgeProps {
  featured: boolean;
}

export default function GalleryFeaturedBadge({
  featured,
}: GalleryFeaturedBadgeProps) {
  if (!featured) return null;
  return (
    <span className="inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
      おすすめ
    </span>
  );
}
