export interface Settings {
  id?: string;
  site_name: string;
  site_description: string;

  logo_url?: string;
  favicon_url?: string;

  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;

  youtube_channel_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  x_url?: string;

  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;

  og_image_url?: string;

  ga4_measurement_id?: string;
  google_tag_manager_id?: string;

  maintenance_mode: boolean;

  created_at?: string;
  updated_at?: string;
}

export type SettingsUpdateInput = {
  [K in keyof Omit<Settings, 'id' | 'created_at' | 'updated_at'>]?:
    | Settings[K]
    | null;
};

export type SettingsTabId =
  | 'general'
  | 'seo'
  | 'social'
  | 'contact'
  | 'integrations'
  | 'branding'
  | 'system';

export const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social' },
  { id: 'contact', label: 'Contact' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'branding', label: 'Branding' },
  { id: 'system', label: 'System' },
];

export const DEFAULT_SETTINGS: Settings = {
  site_name: 'Lombok-Japan Family',
  site_description:
    '日本とインドネシアをつなぐファミリーYouTubeチャンネル。文化・暮らし・食・子育てを家族の視点で発信しています。',
  youtube_channel_url: 'https://www.youtube.com/@lombokjapanfamily',
  seo_title:
    'Lombok-Japan Family | 日本とインドネシアをつなぐファミリーサイト',
  seo_description:
    '日本とインドネシアの国際ファミリーの日常、文化交流、旅行、子育て、グルメ情報を発信。',
  seo_keywords:
    'Lombok, Japan, Indonesia, 国際結婚, 国際家族, ロンボク島, 日本生活, インドネシア生活, YouTube',
  maintenance_mode: false,
};
