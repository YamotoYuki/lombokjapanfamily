export type SponsorStatus =
  | 'proposal'
  | 'negotiating'
  | 'contracted'
  | 'production'
  | 'review'
  | 'published'
  | 'completed'
  | 'cancelled';

export type SponsorType =
  | 'sponsor'
  | 'collaboration'
  | 'advertisement'
  | 'media'
  | 'other';

export interface Sponsor {
  id: string;
  company_name: string;
  project_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  project_type: SponsorType;
  status: SponsorStatus;
  amount: number;
  contract_date?: string;
  start_date?: string;
  due_date?: string;
  publish_date?: string;
  youtube_url?: string;
  notes?: string;
  attachment_url?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type SponsorInput = {
  company_name: string;
  project_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  project_type: SponsorType;
  status: SponsorStatus;
  amount: number;
  contract_date?: string;
  start_date?: string;
  due_date?: string;
  publish_date?: string;
  youtube_url?: string;
  notes?: string;
  attachment_url?: string;
  is_visible?: boolean;
};

export type SponsorListParams = {
  keyword?: string;
  status?: SponsorStatus;
  type?: SponsorType;
  page?: number;
  limit?: number;
};

export type SponsorListResponse = {
  items: Sponsor[];
  page: number;
  limit: number;
  total: number;
};

export type SponsorMonthlyPoint = {
  label: string;
  revenue: number;
  count: number;
};

export type SponsorTypeBreakdown = {
  type: SponsorType | string;
  count: number;
};

export type SponsorStats = {
  total: number;
  in_progress_count: number;
  completed_count: number;
  monthly_revenue: number;
  yearly_revenue: number;
  average_amount: number;
  monthly_series: SponsorMonthlyPoint[];
  type_breakdown: SponsorTypeBreakdown[];
  recent: Sponsor[];
};

export const SPONSOR_STATUS_LABEL: Record<SponsorStatus, string> = {
  proposal: '提案',
  negotiating: '商談中',
  contracted: '契約済',
  production: '制作中',
  review: '確認中',
  published: '公開済',
  completed: '完了',
  cancelled: 'キャンセル',
};

export const SPONSOR_TYPE_LABEL: Record<SponsorType, string> = {
  sponsor: 'スポンサー',
  collaboration: 'コラボ',
  advertisement: '広告',
  media: '取材',
  other: 'その他',
};

export function formatSponsorAmount(amount: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
