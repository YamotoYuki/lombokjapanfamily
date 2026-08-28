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
  title?: string;
  description?: string;
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
