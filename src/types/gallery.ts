import { pickLocalized } from '@/lib/localize';

export type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  /** Legacy mirror of title_ja (kept for older rows / API clients). */
  title?: string;
  description?: string;
  title_ja?: string | null;
  title_en?: string | null;
  title_id?: string | null;
  description_ja?: string | null;
  description_en?: string | null;
  description_id?: string | null;
  image_url: string;
  thumbnail_url?: string;
  category_id?: string;
  category?: GalleryCategory;
  location?: string;
  taken_at?: string;
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type GalleryItemInput = {
  title?: string;
  description?: string;
  title_ja?: string | null;
  title_en?: string | null;
  title_id?: string | null;
  description_ja?: string | null;
  description_en?: string | null;
  description_id?: string | null;
  image_url: string;
  thumbnail_url?: string;
  category_id?: string;
  location?: string;
  taken_at?: string;
  display_order?: number;
  is_featured?: boolean;
  is_visible?: boolean;
};

export type GalleryListParams = {
  keyword?: string;
  category?: string;
  featured?: boolean;
  visible_only?: boolean;
  page?: number;
  limit?: number;
};

export type GalleryListResponse = {
  items: GalleryItem[];
  page: number;
  limit: number;
  total: number;
};

export type GalleryCategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  display_order?: number;
};

export type GalleryStats = {
  total: number;
  visible_count: number;
  featured_count: number;
  recent: GalleryItem[];
};

type GalleryTitleFields = Pick<
  GalleryItem,
  'title' | 'title_ja' | 'title_en' | 'title_id'
>;

type GalleryDescriptionFields = Pick<
  GalleryItem,
  'description' | 'description_ja' | 'description_en' | 'description_id'
>;

/** Resolve gallery title for the active UI language with ja fallback. */
export function localizedGalleryTitle(
  item: GalleryTitleFields,
  lang?: string | null,
): string {
  return pickLocalized(lang, {
    ja: item.title_ja || item.title,
    en: item.title_en,
    id: item.title_id,
  });
}

/** Resolve gallery description for the active UI language with ja fallback. */
export function localizedGalleryDescription(
  item: GalleryDescriptionFields,
  lang?: string | null,
): string {
  return pickLocalized(lang, {
    ja: item.description_ja || item.description,
    en: item.description_en,
    id: item.description_id,
  });
}
