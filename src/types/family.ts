export type FamilyProfile = {
  id: string;
  name: string;
  role?: string;
  photo_url?: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  x_url?: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type FamilyProfileInput = {
  name: string;
  role?: string;
  photo_url?: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  x_url?: string;
  display_order?: number;
  is_visible?: boolean;
};

export type FamilyReorderItem = {
  id: string;
  display_order: number;
};

export type FamilyStats = {
  total: number;
  visible_count: number;
};
