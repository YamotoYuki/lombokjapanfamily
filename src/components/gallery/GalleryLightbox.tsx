import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { GalleryItem } from '@/types/gallery';

interface GalleryLightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export default function GalleryLightbox({ item, onClose }: GalleryLightboxProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title || 'ギャラリー画像'}
    >
      <button
        type="button"
        className="touch-target absolute right-4 top-4 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/40 p-2 text-white"
        onClick={onClose}
        aria-label="閉じる"
      >
        <X size={18} aria-hidden />
      </button>
      <figure
        className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-primary-bg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={item.image_url}
          alt={item.title || 'gallery'}
          loading="eager"
          decoding="async"
          className="max-h-[70vh] w-full object-contain bg-black"
        />
        <figcaption className="space-y-2 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-gold">
            {item.category?.name || '未分類'}
          </p>
          <p className="text-lg font-semibold text-white">
            {item.title || '（無題）'}
          </p>
          {item.description && (
            <p className="text-sm text-muted">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            {item.taken_at && <span>撮影日: {item.taken_at}</span>}
            {item.location && <span>場所: {item.location}</span>}
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
