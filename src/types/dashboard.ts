export type ContactTicketStatus = 'new' | 'in_progress' | 'completed';
export type SponsorDealStatus =
  | 'proposal'
  | 'contracted'
  | 'production'
  | 'published'
  | 'completed';
export type UserAccountStatus = 'active' | 'invited' | 'disabled';
export type AppRoleLabel = 'admin' | 'editor' | 'viewer';

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: 'views' | 'subscribers' | 'contacts' | 'pv';
}

export interface ContactTicket {
  id: string;
  companyName: string;
  contactName: string;
  subject: string;
  status: ContactTicketStatus;
  createdAt: string;
}

export interface RecentPostItem {
  id: string;
  title: string;
  publishedAt: string;
  category: string;
}

export interface RecentVideoItem {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  views: string;
}

export interface SponsorDeal {
  id: string;
  companyName: string;
  projectName: string;
  amount: string;
  status: SponsorDealStatus;
  youtubeUrl: string;
}

export interface AnalyticsPoint {
  label: string;
  pv: number;
  uu: number;
}

export interface PopularPage {
  path: string;
  views: number;
}

export interface CountryTraffic {
  country: string;
  value: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

export interface SocialLinkItem {
  id: string;
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'X';
  handle: string;
  url: string;
  followers: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: AppRoleLabel;
  status: UserAccountStatus;
  lastLogin: string;
}
