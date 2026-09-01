/**
 * Public page imagery (Hero + section page heroes).
 *
 * Temporary Unsplash URLs remain until official photos are ready.
 * Swap for production using any of:
 * 1. Drop files into `public/images/site/` and set
 *    `VITE_USE_LOCAL_SITE_IMAGES=true` in `.env`
 * 2. Override with `VITE_IMAGE_*` env vars (full URL or site path)
 * 3. Replace the STOCK_* strings below
 */

export type PageImageKey =
  | 'homeHero'
  | 'announcements'
  | 'blog'
  | 'contact'
  | 'family'
  | 'gallery'
  | 'videos';

/** Local placeholders under public/images/site/ (used when VITE_USE_LOCAL_SITE_IMAGES=true). */
const LOCAL_SITE_IMAGES: Record<PageImageKey, string> = {
  homeHero: '/images/site/home-hero.jpg',
  announcements: '/images/site/announcements.jpg',
  blog: '/images/site/blog.jpg',
  contact: '/images/site/contact.jpg',
  family: '/images/site/family.jpg',
  gallery: '/images/site/gallery.jpg',
  videos: '/images/site/videos.jpg',
};

/** Temporary stock imagery — replace before public launch. */
const STOCK_SITE_IMAGES: Record<PageImageKey, string> = {
  homeHero:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&auto=format',
  announcements:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=900&fit=crop',
  blog: 'https://images.unsplash.com/photo-1496412705860-fb6f76913ec6?w=1600&h=900&fit=crop',
  contact:
    'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1600&h=900&fit=crop',
  family:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&h=900&fit=crop',
  gallery:
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&h=900&fit=crop',
  videos:
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop',
};

const ENV_KEYS: Record<PageImageKey, string> = {
  homeHero: 'VITE_IMAGE_HOME_HERO',
  announcements: 'VITE_IMAGE_ANNOUNCEMENTS',
  blog: 'VITE_IMAGE_BLOG',
  contact: 'VITE_IMAGE_CONTACT',
  family: 'VITE_IMAGE_FAMILY',
  gallery: 'VITE_IMAGE_GALLERY',
  videos: 'VITE_IMAGE_VIDEOS',
};

function readEnv(name: string): string | undefined {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  return value || undefined;
}

function resolvePageImage(key: PageImageKey): string {
  const fromEnv = readEnv(ENV_KEYS[key]);
  if (fromEnv) return fromEnv;

  const useLocal = readEnv('VITE_USE_LOCAL_SITE_IMAGES') === 'true';
  if (useLocal) return LOCAL_SITE_IMAGES[key];

  return STOCK_SITE_IMAGES[key];
}

/** Resolved URLs currently used by the public site. */
export const PAGE_IMAGES: Record<PageImageKey, string> = {
  homeHero: resolvePageImage('homeHero'),
  announcements: resolvePageImage('announcements'),
  blog: resolvePageImage('blog'),
  contact: resolvePageImage('contact'),
  family: resolvePageImage('family'),
  gallery: resolvePageImage('gallery'),
  videos: resolvePageImage('videos'),
};

/** Stock URLs only (for audits / reports). */
export const STOCK_PAGE_IMAGES = STOCK_SITE_IMAGES;

/** Expected local filenames for production assets. */
export const LOCAL_PAGE_IMAGES = LOCAL_SITE_IMAGES;
