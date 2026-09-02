import { useTranslation } from 'react-i18next';
import GalleryFeaturedBadge from '@/components/gallery/GalleryFeaturedBadge';
import GalleryVisibilityBadge from '@/components/gallery/GalleryVisibilityBadge';
import type { GalleryItem } from '@/types/gallery';

interface GalleryGridProps {
  items: GalleryItem[];
  showMeta?: boolean;
  busyId?: string | null;
  onSelect?: (item: GalleryItem) => void;
}

/** Admin gallery card grid — view-only; edit/delete from detail or table. */
export default function GalleryGrid({
  items,
  showMeta = true,
  onSelect,
}: GalleryGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item)}
          className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 text-left transition-colors hover:border-gold/40"
        >
          <img
            src={item.thumbnail_url || item.image_url}
            alt={item.title || 'gallery'}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          {showMeta ? (
            <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
              <div className="flex flex-wrap gap-1">
                <GalleryFeaturedBadge featured={item.is_featured} />
                <GalleryVisibilityBadge visible={item.is_visible} />
              </div>
              <p className="truncate text-[11px] text-gold">
                {item.category?.name || t('admin.gallery.otherCategory')}
              </p>
              <p className="line-clamp-1 text-sm font-medium text-white">
                {item.title || t('admin.common.untitled')}
              </p>
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
