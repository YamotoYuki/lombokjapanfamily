import { apiClient } from '@/services/apiClient';
import type {
  Post,
  PostCategory,
  PostInput,
  PostListParams,
  PostListResponse,
  PostTag,
  PublicPostDetailResponse,
} from '@/types/post';

type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
  details?: unknown;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (maybeAxios.response?.data?.message) {
      return maybeAxios.response.data.message;
    }
    if (maybeAxios.message) {
      return maybeAxios.message;
    }
  }
  return fallback;
}

async function unwrap<T>(
  promise: Promise<{ data: ApiEnvelope<T> }>,
  fallback: string,
) {
  try {
    const { data } = await promise;
    if (!data.ok || data.data === undefined) {
      throw new Error(data.message ?? fallback);
    }
    return { payload: data.data, message: data.message };
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

function authConfig(accessToken?: string | null, userId?: string | null) {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (userId) headers['X-User-Id'] = userId;
  return Object.keys(headers).length ? { headers } : undefined;
}

export async function fetchPosts(params: PostListParams = {}) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<PostListResponse>>('/posts', { params }),
    '記事取得に失敗しました',
  );
  return payload;
}

export async function fetchPublicPosts(params: PostListParams = {}) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<PostListResponse>>('/posts/public', { params }),
    '記事取得に失敗しました',
  );
  return payload;
}

export async function fetchPost(id: string) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<Post>>(`/posts/${id}`),
    '記事取得に失敗しました',
  );
  return payload;
}

export async function fetchPublicPostBySlug(slug: string) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<PublicPostDetailResponse>>(`/posts/slug/${slug}`),
    '記事取得に失敗しました',
  );
  return payload;
}

export async function createPost(
  input: PostInput,
  accessToken?: string | null,
  userId?: string | null,
) {
  const { payload, message } = await unwrap(
    apiClient.post<ApiEnvelope<Post>>(
      '/posts',
      input,
      authConfig(accessToken, userId),
    ),
    '記事の保存に失敗しました',
  );
  return { post: payload, message };
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>,
  accessToken?: string | null,
  userId?: string | null,
) {
  const { payload, message } = await unwrap(
    apiClient.patch<ApiEnvelope<Post>>(
      `/posts/${id}`,
      input,
      authConfig(accessToken, userId),
    ),
    '記事の保存に失敗しました',
  );
  return { post: payload, message };
}

export async function archivePost(
  id: string,
  accessToken?: string | null,
  userId?: string | null,
) {
  const { payload, message } = await unwrap(
    apiClient.delete<ApiEnvelope<Post>>(
      `/posts/${id}`,
      authConfig(accessToken, userId),
    ),
    '記事の保存に失敗しました',
  );
  return { post: payload, message };
}

export async function uploadPostImage(
  file: File,
  folder: 'featured' | 'content' = 'featured',
  accessToken?: string | null,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  try {
    const { data } = await apiClient.post<
      ApiEnvelope<{ path: string; url: string }>
    >('/posts/upload-image', form, {
      ...(authConfig(accessToken) ?? {}),
      headers: {
        ...(authConfig(accessToken)?.headers ?? {}),
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!data.ok || !data.data) {
      throw new Error(data.message ?? '画像アップロードに失敗しました');
    }
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, '画像アップロードに失敗しました'));
  }
}

export async function fetchPostCategories() {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<{ items: PostCategory[] }>>('/post-categories'),
    'カテゴリーの取得に失敗しました',
  );
  return payload.items;
}

export async function createPostCategory(
  input: Pick<PostCategory, 'name' | 'slug' | 'description'>,
  accessToken?: string | null,
) {
  const { payload } = await unwrap(
    apiClient.post<ApiEnvelope<PostCategory>>(
      '/post-categories',
      input,
      authConfig(accessToken),
    ),
    'カテゴリーの取得に失敗しました',
  );
  return payload;
}

export async function updatePostCategory(
  id: string,
  input: Partial<Pick<PostCategory, 'name' | 'slug' | 'description'>>,
  accessToken?: string | null,
) {
  const { payload } = await unwrap(
    apiClient.patch<ApiEnvelope<PostCategory>>(
      `/post-categories/${id}`,
      input,
      authConfig(accessToken),
    ),
    'カテゴリーの取得に失敗しました',
  );
  return payload;
}

export async function deletePostCategory(
  id: string,
  accessToken?: string | null,
) {
  await unwrap(
    apiClient.delete<ApiEnvelope<{ id: string }>>(
      `/post-categories/${id}`,
      authConfig(accessToken),
    ),
    'カテゴリーの取得に失敗しました',
  );
}

export async function fetchPostTags() {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<{ items: PostTag[] }>>('/post-tags'),
    '通信エラーが発生しました',
  );
  return payload.items;
}

export async function createPostTag(
  input: Pick<PostTag, 'name' | 'slug'>,
  accessToken?: string | null,
) {
  const { payload } = await unwrap(
    apiClient.post<ApiEnvelope<PostTag>>(
      '/post-tags',
      input,
      authConfig(accessToken),
    ),
    '通信エラーが発生しました',
  );
  return payload;
}
