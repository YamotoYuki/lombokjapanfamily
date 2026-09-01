/**
 * Official Lombok-Japan Family brand wallpapers (production, locked).
 *
 * These seven files under `public/images/site/` are the canonical page heroes.
 * Do not swap for stock/Unsplash/dummy imagery.
 *
 * Brand tone for future pages:
 * Japan × Indonesia · gold · sunset · premium · travel · family
 * (Fuji, sakura, pagoda, Lombok sea, palms, Indonesian architecture)
 *
 * Display contract (HeroSection / PageHero):
 * background-size: cover; background-position: center; background-repeat: no-repeat
 * + dark / radial / gradient overlays so HTML titles stay primary over baked-in type.
 */

export type PageImageKey =
  | 'homeHero'
  | 'announcements'
  | 'blog'
  | 'contact'
  | 'family'
  | 'gallery'
  | 'videos';

/** Locked brand wallpaper paths served from `/public/images/site/`. */
export const PAGE_IMAGES: Record<PageImageKey, string> = {
  homeHero: '/images/site/top-wallpaper.jpg',
  family: '/images/site/family-wallpaper.jpg',
  gallery: '/images/site/galery-wallpaper.jpg',
  videos: '/images/site/video-wallpaper.jpg',
  announcements: '/images/site/news-wallpaper.jpg',
  blog: '/images/site/blog-wallpaper.jpg',
  contact: '/images/site/contact-wallpaper.jpg',
} as const;
