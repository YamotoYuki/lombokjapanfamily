import { pickLocalized } from '@/lib/localize';

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
  /** Legacy mirrors of the *_ja fields (kept for older rows / API clients). */
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  title_ja?: string | null;
  title_en?: string | null;
  title_id?: string | null;
  content_ja?: string | null;
  content_en?: string | null;
  content_id?: string | null;
  excerpt_ja?: string | null;
  excerpt_en?: string | null;
  excerpt_id?: string | null;
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
  title_ja?: string | null;
  title_en?: string | null;
  title_id?: string | null;
  content_ja?: string | null;
  content_en?: string | null;
  content_id?: string | null;
  excerpt_ja?: string | null;
  excerpt_en?: string | null;
  excerpt_id?: string | null;
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

/** Resolve post title for the active UI language with ja fallback. */
export function localizedPostTitle(
  post: Pick<Post, 'title' | 'title_ja' | 'title_en' | 'title_id'>,
  lang?: string | null,
): string {
  return pickLocalized(lang, {
    ja: post.title_ja || post.title,
    en: post.title_en,
    id: post.title_id,
  });
}

/** Resolve post body for the active UI language with ja fallback. */
export function localizedPostContent(
  post: Pick<Post, 'content' | 'content_ja' | 'content_en' | 'content_id'>,
  lang?: string | null,
): string {
  return pickLocalized(lang, {
    ja: post.content_ja || post.content,
    en: post.content_en,
    id: post.content_id,
  });
}

/** Resolve post excerpt for the active UI language with ja fallback. */
export function localizedPostExcerpt(
  post: Pick<Post, 'excerpt' | 'excerpt_ja' | 'excerpt_en' | 'excerpt_id'>,
  lang?: string | null,
): string {
  return pickLocalized(lang, {
    ja: post.excerpt_ja || post.excerpt,
    en: post.excerpt_en,
    id: post.excerpt_id,
  });
}

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  // Compact admin/list format: 2026/08/31 14:33
  void lang;
  return `${y}/${m}/${d} ${hh}:${mm}`;
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
