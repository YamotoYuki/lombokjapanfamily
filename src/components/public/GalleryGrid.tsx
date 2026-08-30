import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LazyImage from '@/components/common/LazyImage';
import { translateCategoryName } from '@/lib/publicLabels';
import type { PublicGalleryItem } from '@/types/public';

interface GalleryGridProps {
  items: PublicGalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-sm text-muted">
        {t('gallery.empty')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/gallery/${item.id}`}
          className="group relative aspect-[4/3] min-h-11 overflow-hidden rounded-2xl border border-white/10 text-left"
        >
          <LazyImage
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
            <p className="truncate text-[10px] uppercase tracking-wide text-gold sm:text-[11px]">
              {translateCategoryName(item.category, t)}
            </p>
            <p className="line-clamp-2 text-xs font-medium text-white sm:text-sm">
              {item.title}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
