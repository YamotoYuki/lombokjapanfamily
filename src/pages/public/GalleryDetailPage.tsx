import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { GalleryLightbox } from '@/components/gallery';
import { useGallery, useGalleryItem } from '@/hooks/useGallery';
import { translateCategoryName } from '@/lib/publicLabels';
import {
  localizedGalleryDescription,
  localizedGalleryTitle,
} from '@/types/gallery';

export default function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const itemId = id?.trim() || '';
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const navigate = useNavigate();
  const detailQuery = useGalleryItem(itemId || undefined);
  const listQuery = useGallery({
    visible_only: true,
    page: 1,
    limit: 48,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const item =
    detailQuery.data && detailQuery.data.id === itemId
      ? detailQuery.data
      : undefined;
  const visible =
    item && item.is_visible !== false ? item : undefined;

  const siblings = useMemo(
    () => listQuery.data?.items ?? (visible ? [visible] : []),
    [listQuery.data?.items, visible],
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/gallery');
  };

  const postedAt = visible?.taken_at || visible?.created_at?.slice(0, 10);
  const locale =
    (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2) === 'en'
      ? 'en-US'
      : (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2) === 'id'
        ? 'id-ID'
        : 'ja-JP';
  const postedLabel = postedAt
    ? new Date(postedAt).toLocaleDateString(locale)
    : null;

  const displayTitle = visible
    ? localizedGalleryTitle(visible, lang) || t('common.untitled')
    : '';
  const displayDescription = visible
    ? localizedGalleryDescription(visible, lang)
    : '';
  const pageTitle = visible
    ? `${displayTitle} | ${t('nav.gallery')}`
    : t('seo.galleryTitle');
  const pageDescription =
    displayDescription.trim() || t('seo.galleryDescription');
  const ogImage = visible?.image_url;

  const openLightbox = () => {
    if (!visible) return;
    const idx = siblings.findIndex((row) => row.id === visible.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  return (
    <div key={itemId} className="public-page-offset min-h-screen overflow-x-hidden bg-[#0d1524]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      </Helmet>

      {(detailQuery.isLoading || detailQuery.isPending) && !visible ? (
        <p className="px-4 py-20 text-center text-sm text-muted">
          {t('gallery.loading')}
        </p>
      ) : null}

      {detailQuery.isError && !visible ? (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-red-300">{t('gallery.error')}</p>
          <Link
            to="/gallery"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('gallery.backToList')}
          </Link>
        </div>
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && !visible ? (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-muted">{t('gallery.notFound')}</p>
          <Link
            to="/gallery"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('gallery.backToList')}
          </Link>
        </div>
      ) : null}

      {visible ? (
        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <FadeIn>
            <button
              type="button"
              onClick={openLightbox}
              className="group relative block w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/40 text-left"
              aria-label={t('gallery.openLightbox')}
            >
              <img
                src={visible.image_url}
                alt={displayTitle}
                className="max-h-[70vh] w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] text-white/80">
                {t('gallery.tapToEnlarge')}
              </span>
            </button>

            <div className="mt-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                {translateCategoryName(visible.category?.name, t)}
              </p>
              <h1 className="break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                {displayTitle}
              </h1>
              {displayDescription.trim() ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85 sm:text-[15px]">
                  {displayDescription}
                </p>
              ) : null}
              {postedLabel ? (
                <p className="text-sm text-muted">
                  {t('gallery.postedAt')}: {postedLabel}
                </p>
              ) : null}
              {visible.location?.trim() ? (
                <p className="text-sm text-muted">
                  {t('gallery.location')}: {visible.location}
                </p>
              ) : null}
            </div>

            <div className="mt-10">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t('gallery.backToList')}
                className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ArrowLeft size={16} aria-hidden />
                {t('gallery.backToList')}
              </button>
            </div>
          </FadeIn>
        </div>
      ) : null}

      {lightboxOpen && siblings.length > 0 ? (
        <GalleryLightbox
          items={siblings}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
