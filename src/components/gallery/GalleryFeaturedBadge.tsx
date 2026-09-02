import { useTranslation } from 'react-i18next';

interface GalleryFeaturedBadgeProps {
  featured: boolean;
}

export default function GalleryFeaturedBadge({
  featured,
}: GalleryFeaturedBadgeProps) {
  const { t } = useTranslation();

  if (!featured) return null;
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
      {t('admin.common.featured')}
    </span>
  );
}
