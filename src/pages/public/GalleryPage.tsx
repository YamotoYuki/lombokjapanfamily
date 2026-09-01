import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FadeIn, PageHero } from '@/components/public';
import { PAGE_IMAGES } from '@/data/pageImages';
import { useGallery } from '@/hooks/useGallery';
import { useGalleryCategories } from '@/hooks/useGalleryCategories';
import { translateCategoryName } from '@/lib/publicLabels';
import { localizedGalleryTitle } from '@/types/gallery';

export default function GalleryPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const [category, setCategory] = useState('');

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
  const ogImage = items[0]?.image_url;

  return (
    <>
      <Helmet>
        <title>{t('seo.galleryTitle')}</title>
        <meta name="description" content={t('seo.galleryDescription')} />
        <meta property="og:title" content={t('seo.galleryTitle')} />
        <meta
          property="og:description"
          content={t('seo.galleryDescription')}
        />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <meta name="twitter:title" content={t('seo.galleryTitle')} />
        <meta
          name="twitter:description"
          content={t('seo.galleryDescription')}
        />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      </Helmet>

      <PageHero
        eyebrow={t('gallery.eyebrow')}
        title={t('gallery.title')}
        description={t('gallery.description')}
        backgroundImage={ogImage || PAGE_IMAGES.gallery}
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <FadeIn>
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={[
                'touch-target inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-medium transition-all',
                !category
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/25'
                  : 'border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white',
              ].join(' ')}
            >
              {t('common.all')}
            </button>
            {categories.map((item) => {
              const activeCategory = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={[
                    'touch-target inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-medium transition-all',
                    activeCategory
                      ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/25'
                      : 'border border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-white',
                  ].join(' ')}
                >
                  {translateCategoryName(item.name, t)}
                </button>
              );
            })}
          </div>
        </FadeIn>

        {galleryQuery.isLoading && (
          <p className="text-sm text-muted">{t('gallery.loading')}</p>
        )}
        {galleryQuery.isError && (
          <p className="text-sm text-red-300">{t('gallery.error')}</p>
        )}

        {!galleryQuery.isLoading && !galleryQuery.isError && (
          <FadeIn delayMs={80}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={`/gallery/${item.id}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left"
                >
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={localizedGalleryTitle(item, lang) || 'gallery'}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                    <p className="truncate text-[10px] uppercase tracking-wide text-gold sm:text-[11px]">
                      {translateCategoryName(item.category?.name, t)}
                    </p>
                    <p className="line-clamp-2 text-xs font-medium text-white sm:text-sm">
                      {localizedGalleryTitle(item, lang) ||
                        t('common.untitled')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {items.length === 0 && (
              <p className="mt-8 text-center text-sm text-muted">
                {t('gallery.empty')}
              </p>
            )}
          </FadeIn>
        )}
      </section>
    </>
  );
}
