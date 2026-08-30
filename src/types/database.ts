export type AppRole = 'admin' | 'editor' | 'viewer';

export type PostStatus = 'draft' | 'scheduled' | 'published';
export type ContactStatus = 'new' | 'in_progress' | 'completed';
export type SponsorStatus =
  | 'proposal'
  | 'contracted'
  | 'production'
  | 'published'
  | 'completed';

/** Use `type` (not `interface`) so Rows satisfy Supabase `Record<string, unknown>`. */
export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  last_login_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at?: string;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: UserRole;
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          youtube_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          category: string | null;
          views: number;
          published_at: string | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          category?: string | null;
          views?: number;
          published_at?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          category?: string | null;
          views?: number;
          published_at?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      post_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          excerpt: string | null;
          featured_image: string | null;
          category_id: string | null;
          status: PostStatus;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          status?: PostStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          status?: PostStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };
      gallery_categories: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      gallery: {
        Row: {
          id: string;
          image_url: string;
          title: string | null;
          description: string | null;
          category_id: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          title?: string | null;
          description?: string | null;
          category_id?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          title?: string | null;
          description?: string | null;
          category_id?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          company_name: string | null;
          contact_name: string;
          email: string;
          subject: string | null;
          message: string;
          attachment_url: string | null;
          status: ContactStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name?: string | null;
          contact_name: string;
          email: string;
          subject?: string | null;
          message: string;
          attachment_url?: string | null;
          status?: ContactStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          contact_name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          attachment_url?: string | null;
          status?: ContactStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      family_profiles: {
        Row: {
          id: string;
          name: string;
          display_name: string | null;
          nickname: string | null;
          role: string | null;
          photo_url: string | null;
          description: string | null;
          hometown: string | null;
          current_location: string | null;
          languages: string | null;
          hobbies: string | null;
          favorite_food: string | null;
          favorite_japan: string | null;
          favorite_indonesia: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          x_url: string | null;
          display_order: number;
          is_visible: boolean;
          show_on_home: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name?: string | null;
          nickname?: string | null;
          role?: string | null;
          photo_url?: string | null;
          description?: string | null;
          hometown?: string | null;
          current_location?: string | null;
          languages?: string | null;
          hobbies?: string | null;
          favorite_food?: string | null;
          favorite_japan?: string | null;
          favorite_indonesia?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          x_url?: string | null;
          display_order?: number;
          is_visible?: boolean;
          show_on_home?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string | null;
          nickname?: string | null;
          role?: string | null;
          photo_url?: string | null;
          description?: string | null;
          hometown?: string | null;
          current_location?: string | null;
          languages?: string | null;
          hobbies?: string | null;
          favorite_food?: string | null;
          favorite_japan?: string | null;
          favorite_indonesia?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          x_url?: string | null;
          display_order?: number;
          is_visible?: boolean;
          show_on_home?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sns_links: {
        Row: {
          id: string;
          platform: string;
          url: string;
        };
        Insert: {
          id?: string;
          platform: string;
          url: string;
        };
        Update: {
          id?: string;
          platform?: string;
          url?: string;
        };
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          company_name: string;
          project_name: string | null;
          contact_person: string | null;
          amount: number | null;
          contract_date: string | null;
          status: SponsorStatus;
          youtube_url: string | null;
        };
        Insert: {
          id?: string;
          company_name: string;
          project_name?: string | null;
          contact_person?: string | null;
          amount?: number | null;
          contract_date?: string | null;
          status?: SponsorStatus;
          youtube_url?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          project_name?: string | null;
          contact_person?: string | null;
          amount?: number | null;
          contract_date?: string | null;
          status?: SponsorStatus;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      analytics_cache: {
        Row: {
          id: string;
          date: string;
          pv: number;
          uu: number;
          avg_session: number | null;
          bounce_rate: number | null;
        };
        Insert: {
          id?: string;
          date: string;
          pv?: number;
          uu?: number;
          avg_session?: number | null;
          bounce_rate?: number | null;
        };
        Update: {
          id?: string;
          date?: string;
          pv?: number;
          uu?: number;
          avg_session?: number | null;
          bounce_rate?: number | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          site_name: string;
          site_description: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_address: string | null;
          youtube_channel_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          facebook_url: string | null;
          x_url: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          og_image_url: string | null;
          ga4_measurement_id: string | null;
          google_tag_manager_id: string | null;
          maintenance_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_name: string;
          site_description?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_address?: string | null;
          youtube_channel_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          x_url?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          og_image_url?: string | null;
          ga4_measurement_id?: string | null;
          google_tag_manager_id?: string | null;
          maintenance_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_name?: string;
          site_description?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_address?: string | null;
          youtube_channel_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          x_url?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          og_image_url?: string | null;
          ga4_measurement_id?: string | null;
          google_tag_manager_id?: string | null;
          maintenance_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: { required_roles: AppRole[] };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      post_status: PostStatus;
      contact_status: ContactStatus;
      sponsor_status: SponsorStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
