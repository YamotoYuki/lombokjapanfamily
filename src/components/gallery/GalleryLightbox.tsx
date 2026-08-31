import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateCategoryName } from '@/lib/publicLabels';
import {
  localizedGalleryDescription,
  localizedGalleryTitle,
  type GalleryItem,
} from '@/types/gallery';

interface GalleryLightboxProps {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export default function GalleryLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const touchStartX = useRef<number | null>(null);
  const item = items[index];
  const hasMultiple = items.length > 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (!hasMultiple || !onIndexChange) return;
      if (event.key === 'ArrowLeft') {
        onIndexChange((index - 1 + items.length) % items.length);
      }
      if (event.key === 'ArrowRight') {
        onIndexChange((index + 1) % items.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [hasMultiple, index, items.length, onClose, onIndexChange]);

  if (!item) return null;

  const goPrev = () => {
    if (!onIndexChange || !hasMultiple) return;
    onIndexChange((index - 1 + items.length) % items.length);
  };

  const goNext = () => {
    if (!onIndexChange || !hasMultiple) return;
    onIndexChange((index + 1) % items.length);
  };

  const categoryLabel = translateCategoryName(item.category?.name, t);
  const postedAt = item.taken_at || item.created_at?.slice(0, 10);
  const displayTitle =
    localizedGalleryTitle(item, lang) || t('common.untitled');
  const displayDescription = localizedGalleryDescription(item, lang);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 p-2 pb-[max(0.5rem,var(--safe-bottom))] backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle || t('gallery.title')}
    >
      <button
        type="button"
        className="touch-target absolute right-2 top-[max(0.5rem,var(--safe-top))] z-20 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/60 p-2 text-white sm:right-4 sm:top-4"
        onClick={onClose}
        aria-label={t('common.close')}
      >
        <X size={18} aria-hidden />
      </button>

      {hasMultiple && onIndexChange ? (
        <>
          <button
            type="button"
            className="touch-target absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-black/50 p-2 text-white md:inline-flex"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            aria-label={t('common.prev')}
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
          <button
            type="button"
            className="touch-target absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-black/50 p-2 text-white md:inline-flex"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label={t('common.next')}
          >
            <ChevronRight size={22} aria-hidden />
          </button>
        </>
      ) : null}

      <figure
        className="max-h-[min(92vh,920px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-primary-bg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null || !hasMultiple || !onIndexChange) {
            return;
          }
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const delta = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 48) return;
          if (delta > 0) goPrev();
          else goNext();
        }}
      >
        <img
          src={item.image_url}
          alt={displayTitle || 'gallery'}
          loading="eager"
          decoding="async"
          className="max-h-[52vh] w-full bg-black object-contain sm:max-h-[70vh]"
        />
        <figcaption className="space-y-2 px-3 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-wide text-gold">
            {categoryLabel}
          </p>
          <p className="break-words text-base font-semibold text-white sm:text-lg">
            {displayTitle}
          </p>
          {displayDescription ? (
            <p className="break-words text-sm leading-relaxed text-muted">
              {displayDescription}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            {postedAt ? (
              <span>
                {t('gallery.postedAt')}: {postedAt}
              </span>
            ) : null}
            {item.location ? (
              <span className="break-words">
                {t('gallery.location')}: {item.location}
              </span>
            ) : null}
            {hasMultiple ? (
              <span>
                {index + 1} / {items.length}
              </span>
            ) : null}
          </div>
          {hasMultiple && onIndexChange ? (
            <div className="flex gap-2 pt-1 md:hidden">
              <button
                type="button"
                className="touch-target inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 text-sm text-white"
                onClick={goPrev}
                aria-label={t('common.prev')}
              >
                <ChevronLeft size={18} aria-hidden />
                {t('common.prev')}
              </button>
              <button
                type="button"
                className="touch-target inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 text-sm text-white"
                onClick={goNext}
                aria-label={t('common.next')}
              >
                {t('common.next')}
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
