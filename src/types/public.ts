export interface PublicVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: string;
  publishedAt: string;
  duration: string;
  youtubeUrl: string;
}

export interface PublicFamilyMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
}

export interface PublicBlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: string;
  category: string;
}

export type GalleryCategory =
  | 'すべて'
  | '旅行'
  | '日常'
  | 'イベント'
  | '子供'
  | 'インドネシア'
  | '日本'
  | '家族'
  | 'Vlog'
  | string;

export interface PublicGalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

export interface PublicSponsor {
  id: string;
  name: string;
  logoLabel: string;
  description: string;
  website: string;
}

export interface ChannelStat {
  id: string;
  label: string;
  value: string;
}
