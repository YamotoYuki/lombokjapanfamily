import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LazyImage from '@/components/common/LazyImage';
import { translateCategoryName } from '@/lib/publicLabels';
import type { PublicGalleryItem } from '@/types/public';

const FILTERS = [
  { id: 'all', match: null },
  { id: 'travel', match: '旅行' },
  { id: 'daily', match: '日常' },
  { id: 'event', match: 'イベント' },
  { id: 'kids', match: '子供' },
  { id: 'indonesia', match: 'インドネシア' },
  { id: 'japan', match: '日本' },
] as const;

interface GalleryGridProps {
  items: PublicGalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]['id']>('all');
  const [activeItem, setActiveItem] = useState<PublicGalleryItem | null>(null);

  const filtered = useMemo(() => {
    const match = FILTERS.find((item) => item.id === activeFilter)?.match;
    if (!match) return items;
    return items.filter((item) => item.category === match);
  }, [activeFilter, items]);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [activeItem]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.id === activeFilter;
          const label =
            filter.id === 'all'
              ? t('common.all')
              : t(`gallery.categories.${filter.id}`);
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={[
                'touch-target rounded-full px-4 py-2 text-xs font-medium transition-all',
                active
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/25'
                  : 'border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveItem(item)}
            className="group relative aspect-[4/3] min-h-11 overflow-hidden rounded-2xl border border-white/10 text-left"
          >
            <LazyImage
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gold">
                {translateCategoryName(item.category, t)}
              </p>
              <p className="text-sm font-medium text-white">{item.title}</p>
            </div>
          </button>
        ))}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setActiveItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
        >
          <button
            type="button"
            className="touch-target absolute right-4 top-4 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/40 p-2 text-white"
            onClick={() => setActiveItem(null)}
            aria-label={t('common.close')}
          >
            <X size={18} aria-hidden />
          </button>
          <figure
            className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-primary-bg shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <LazyImage
              src={activeItem.imageUrl}
              alt={activeItem.title}
              loading="eager"
              className="max-h-[70vh] w-full object-cover"
              sizes="100vw"
            />
            <figcaption className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gold">
                  {translateCategoryName(activeItem.category, t)}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {activeItem.title}
                </p>
              </div>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
