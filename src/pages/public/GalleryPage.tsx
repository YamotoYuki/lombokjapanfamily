import { useMemo, useState } from 'react';
import { FadeIn, PageHero } from '@/components/public';
import { GalleryLightbox } from '@/components/gallery';
import { useGallery } from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import type { GalleryItem } from '@/types/gallery';

export default function GalleryPage() {
  const [category, setCategory] = useState('');
  const [active, setActive] = useState<GalleryItem | null>(null);

  const params = useMemo(
    () => ({
      visible_only: true,
      category: category || undefined,
      page: 1,
      limit: 48,
    }),
    [category],
  );

  const galleryQuery = useGallery(params);
  const categoriesQuery = useGalleryCategories();
  const items = galleryQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Photo Gallery"
        description="カテゴリ別に、旅・日常・イベントのビジュアルアーカイブを公開しています。"
        backgroundImage="https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&h=900&fit=crop"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <FadeIn>
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={[
                'rounded-full px-4 py-2 text-xs font-medium transition-all',
                !category
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/25'
                  : 'border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white',
              ].join(' ')}
            >
              すべて
            </button>
            {categories.map((item) => {
              const activeCategory = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={[
                    'rounded-full px-4 py-2 text-xs font-medium transition-all',
                    activeCategory
                      ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/25'
                      : 'border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white',
                  ].join(' ')}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </FadeIn>

        {galleryQuery.isLoading && (
          <p className="text-sm text-muted">写真を読み込んでいます...</p>
        )}
        {galleryQuery.isError && (
          <p className="text-sm text-red-300">写真の取得に失敗しました</p>
        )}

        {!galleryQuery.isLoading && !galleryQuery.isError && (
          <FadeIn delayMs={80}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left"
                >
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.title || 'gallery'}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gold">
                      {item.category?.name || '未分類'}
                    </p>
                    <p className="text-sm font-medium text-white">
                      {item.title || '（無題）'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {items.length === 0 && (
              <p className="mt-8 text-center text-sm text-muted">
                公開中の写真はまだありません。
              </p>
            )}
          </FadeIn>
        )}
      </section>

      {active && (
        <GalleryLightbox item={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}
