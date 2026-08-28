export type Nullable<T> = T | null;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type {
  AppRole,
  ContactStatus,
  Database,
  PostStatus,
  Profile,
  SponsorStatus,
  UserRole,
} from './database';

export type {
  AdminUserRow,
  AnalyticsPoint,
  ContactTicket,
  ContactTicketStatus,
  CountryTraffic,
  FamilyMember,
  GalleryItem,
  KpiMetric,
  PopularPage,
  RecentPostItem,
  RecentVideoItem,
  SocialLinkItem,
  SponsorDeal,
  SponsorDealStatus,
  UserAccountStatus,
} from './dashboard';
