import { useState } from 'react';
import GalleryFeaturedBadge from '@/components/gallery/GalleryFeaturedBadge';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import GalleryVisibilityBadge from '@/components/gallery/GalleryVisibilityBadge';
import type { GalleryItem } from '@/types/gallery';

interface GalleryGridProps {
  items: GalleryItem[];
  showMeta?: boolean;
  onSelect?: (item: GalleryItem) => void;
}

export default function GalleryGrid({
  items,
  showMeta = true,
  onSelect,
}: GalleryGridProps) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelect?.(item);
              setActive(item);
            }}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left"
          >
            <img
              src={item.thumbnail_url || item.image_url}
              alt={item.title || 'gallery'}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            {showMeta && (
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
                <div className="flex flex-wrap gap-1">
                  <GalleryFeaturedBadge featured={item.is_featured} />
                  <GalleryVisibilityBadge visible={item.is_visible} />
                </div>
                <p className="text-[11px] text-gold">
                  {item.category?.name || '未分類'}
                </p>
                <p className="text-sm font-medium text-white">
                  {item.title || '（無題）'}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {active && (
        <GalleryLightbox item={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}
