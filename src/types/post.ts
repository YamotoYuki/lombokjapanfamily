export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type PostTag = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  category_id?: string;
  category?: PostCategory | null;
  tags?: PostTag[];
  status: PostStatus;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  scheduled_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
};

export type PostListParams = {
  keyword?: string;
  category?: string;
  tag?: string;
  status?: PostStatus | '';
  page?: number;
  limit?: number;
};

export type PostListResponse = {
  items: Post[];
  total: number;
  page: number;
  limit: number;
};

export type PostInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  category_id?: string | null;
  status: PostStatus;
  seo_title?: string;
  seo_description?: string;
  published_at?: string | null;
  scheduled_at?: string | null;
  tags?: Array<string | { id?: string; name: string; slug?: string }>;
};

export type PublicPostDetailResponse = {
  post: Post;
  related: Post[];
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: '下書き',
  scheduled: '公開予約',
  published: '公開済み',
  archived: '削除済み',
};

export function formatPostDate(value?: string | null, lang = 'ja') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale =
    lang.slice(0, 2) === 'en'
      ? 'en-US'
      : lang.slice(0, 2) === 'id'
        ? 'id-ID'
        : 'ja-JP';
  return date.toLocaleString(locale);
}

export function generatePostSlug(title: string) {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (ascii.length >= 3) {
    return ascii.slice(0, 80);
  }

  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `post-${stamp}-${suffix}`;
}
