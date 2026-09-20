import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { PAGE_IMAGES, type PageImageKey } from '@/data/pageImages';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SiteSeoProps {
  settings?: Settings | null;
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type SeoPageKey =
  | 'home'
  | 'blog'
  | 'gallery'
  | 'family'
  | 'contact'
  | 'videos'
  | 'announcements';

const PATH_BRAND_IMAGE: Record<SeoPageKey, PageImageKey> = {
  home: 'homeHero',
  blog: 'blog',
  gallery: 'gallery',
  family: 'family',
  contact: 'contact',
  videos: 'videos',
  announcements: 'announcements',
};

/**
 * Dedicated OGP/Twitter Card share image (1200x630 PNG) — distinct from the
 * PAGE_IMAGES hero wallpapers, which are full-bleed page backgrounds, not
 * pre-cropped social-card assets. Used as the default og:image for the home
 * page and any unmatched route; other pages keep their own hero wallpaper
 * as og:image unless an admin sets settings.og_image_url.
 */
const DEFAULT_OG_IMAGE = '/images/site/og_lfj.png';
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';
const DEFAULT_OG_IMAGE_TYPE = 'image/png';

function seoKeyForPath(path: string): SeoPageKey | null {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/') return 'home';
  if (normalized.startsWith('/blog')) return 'blog';
  if (normalized.startsWith('/gallery')) return 'gallery';
  if (normalized.startsWith('/family')) return 'family';
  if (normalized.startsWith('/contact')) return 'contact';
  if (normalized.startsWith('/videos')) return 'videos';
  if (normalized.startsWith('/announcements')) return 'announcements';
  return null;
}

function toAbsoluteUrl(siteUrl: string | undefined, pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!siteUrl) return undefined;
  return `${siteUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export default function SiteSeo({
  settings,
  title,
  description,
  keywords,
  path = '/',
  image,
  noIndex,
}: SiteSeoProps) {
  const { t, i18n } = useTranslation();
  const s = settings ?? DEFAULT_SETTINGS;
  const lang = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);
  const pageKey = seoKeyForPath(path);

  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  );

  const localizedTitle = pageKey ? t(`seo.${pageKey}Title`) : undefined;
  const localizedDescription = pageKey
    ? t(`seo.${pageKey}Description`)
    : undefined;
  const localizedKeywords = t('seo.homeKeywords');

  const pageTitle =
    title ||
    localizedTitle ||
    s.seo_title ||
    DEFAULT_SETTINGS.seo_title ||
    s.site_name ||
    DEFAULT_SETTINGS.site_name;
  const pageDescription =
    description ||
    localizedDescription ||
    s.seo_description ||
    s.site_description ||
    DEFAULT_SETTINGS.seo_description ||
    DEFAULT_SETTINGS.site_description;
  const pageKeywords =
    keywords || localizedKeywords || s.seo_keywords || DEFAULT_SETTINGS.seo_keywords;
  const brandImagePath = pageKey
    ? PAGE_IMAGES[PATH_BRAND_IMAGE[pageKey]]
    : PAGE_IMAGES.homeHero;
  const defaultImagePath =
    pageKey === 'home' || !pageKey ? DEFAULT_OG_IMAGE : brandImagePath;
  const ogImage =
    toAbsoluteUrl(siteUrl, image) ||
    toAbsoluteUrl(siteUrl, s.og_image_url || undefined) ||
    toAbsoluteUrl(siteUrl, defaultImagePath);
  // Only the dedicated share-card default has known, fixed dimensions/type;
  // an admin-set og_image_url or an explicit image prop could be anything.
  const ogImageIsDefaultCard =
    !image && !s.og_image_url && defaultImagePath === DEFAULT_OG_IMAGE;
  const favicon = s.favicon_url || '/favicon.ico';
  const canonical = siteUrl
    ? `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
    : undefined;
  const rawGaId = s.ga4_measurement_id?.trim() || '';
  const gaId = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : '';
  const rawGtmId = s.google_tag_manager_id?.trim() || '';
  const gtmId = /^GTM-[A-Z0-9]+$/i.test(rawGtmId) ? rawGtmId : '';
  const isHome = path.replace(/\/$/, '') === '' || path === '/';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // One-time cleanup: remove index.html's static SEO fallback tags once
  // React mounts, since react-helmet-async only ever manages tags it has
  // itself rendered — it won't replace pre-existing static ones with the
  // same name/property, so without this they'd sit duplicated in <head>
  // with the static (homepage) values outranking the correct per-page
  // canonical/OGP tags below.
  useEffect(() => {
    document
      .querySelectorAll('[data-seo-fallback]')
      .forEach((el) => el.remove());
  }, []);

  useEffect(() => {
    if (!gaId || document.getElementById('ljf-ga4-script')) return;
    const script = document.createElement('script');
    script.id = 'ljf-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }, [gaId]);

  useEffect(() => {
    if (!gtmId || document.getElementById('ljf-gtm-script')) return;
    const script = document.createElement('script');
    script.id = 'ljf-gtm-script';
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);
  }, [gtmId]);

  return (
    <Helmet>
      <html lang={lang} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {pageKeywords ? <meta name="keywords" content={pageKeywords} /> : null}
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {canonical ? <link rel="alternate" hrefLang="ja" href={canonical} /> : null}
      {canonical ? <link rel="alternate" hrefLang="id" href={canonical} /> : null}
      {canonical ? <link rel="alternate" hrefLang="en" href={canonical} /> : null}
      {canonical ? (
        <link rel="alternate" hrefLang="x-default" href={canonical} />
      ) : null}
      <link rel="icon" href={favicon} />
      {isHome ? (
        <link
          rel="preload"
          as="image"
          href={PAGE_IMAGES.homeHero}
          type="image/jpeg"
        />
      ) : null}
      <meta
        property="og:locale"
        content={lang === 'ja' ? 'ja_JP' : lang === 'id' ? 'id_ID' : 'en_US'}
      />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage && ogImageIsDefaultCard ? (
        <meta property="og:image:width" content={DEFAULT_OG_IMAGE_WIDTH} />
      ) : null}
      {ogImage && ogImageIsDefaultCard ? (
        <meta property="og:image:height" content={DEFAULT_OG_IMAGE_HEIGHT} />
      ) : null}
      {ogImage && ogImageIsDefaultCard ? (
        <meta property="og:image:type" content={DEFAULT_OG_IMAGE_TYPE} />
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
