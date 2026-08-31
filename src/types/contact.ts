export type ContactStatus = 'new' | 'in_progress' | 'completed' | 'archived';

export type ContactPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ContactType =
  | 'general'
  | 'sponsor'
  | 'collaboration'
  | 'media'
  | 'other';

export type Contact = {
  id: string;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachment_url?: string;
  attachment_name?: string;
  contact_type: ContactType;
  status: ContactStatus;
  priority: ContactPriority;
  assigned_to?: string;
  internal_note?: string;
  created_at: string;
  updated_at: string;
  responded_at?: string;
};

export type ContactStats = {
  total: number;
  new_count: number;
  in_progress_count: number;
  completed_count: number;
  monthly_count: number;
  sponsor_related_count: number;
};

export type ContactListParams = {
  keyword?: string;
  status?: ContactStatus | '';
  contact_type?: ContactType | '';
  priority?: ContactPriority | '';
  page?: number;
  limit?: number;
};

export type ContactListResponse = {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
};

export type ContactInput = {
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  contact_type: ContactType;
  attachment?: File | null;
  /** Cloudflare Turnstile token (required when server secret is configured). */
  cf_turnstile_response?: string;
};

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: '未対応',
  in_progress: '対応中',
  completed: '完了',
  archived: 'アーカイブ',
};

export const CONTACT_PRIORITY_LABEL: Record<ContactPriority, string> = {
  low: '低',
  normal: '通常',
  high: '高',
  urgent: '緊急',
};

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  general: '一般お問い合わせ',
  sponsor: '企業案件',
  collaboration: 'コラボ依頼',
  media: '取材依頼',
  other: 'その他',
};

export function formatContactDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ja-JP');
}
