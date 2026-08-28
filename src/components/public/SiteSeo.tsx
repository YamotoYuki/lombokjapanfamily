import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SiteSeoProps {
  settings?: Settings | null;
  title?: string;
  description?: string;
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

export default function SiteSeo({
  settings,
  title,
  description,
  path = '/',
  image,
  noIndex,
}: SiteSeoProps) {
  const s = settings ?? DEFAULT_SETTINGS;
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  );
  const pageTitle =
    title || s.seo_title || s.site_name || DEFAULT_SETTINGS.site_name;
  const pageDescription =
    description ||
    s.seo_description ||
    s.site_description ||
    DEFAULT_SETTINGS.site_description;
  const keywords = s.seo_keywords || undefined;
  const ogImage = image || s.og_image_url || undefined;
  const favicon = s.favicon_url || '/favicon.svg';
  const canonical = siteUrl
    ? `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
    : undefined;
  const rawGaId = s.ga4_measurement_id?.trim() || '';
  const gaId = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : '';
  const rawGtmId = s.google_tag_manager_id?.trim() || '';
  const gtmId = /^GTM-[A-Z0-9]+$/i.test(rawGtmId) ? rawGtmId : '';

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
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <link rel="icon" href={favicon} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
