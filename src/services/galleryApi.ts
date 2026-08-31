import { apiClient } from '@/services/apiClient';
import type {
  GalleryCategory,
  GalleryCategoryInput,
  GalleryItem,
  GalleryItemInput,
  GalleryListParams,
  GalleryListResponse,
  GalleryStats,
} from '@/types/gallery';

type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
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

export async function fetchGallery(params: GalleryListParams = {}) {
  const { payload } = await unwrap<GalleryListResponse>(
    apiClient.get('/gallery', { params }),
    '写真の取得に失敗しました',
  );
  return payload;
}

export async function fetchGalleryItem(id: string) {
  const { payload } = await unwrap<GalleryItem>(
    apiClient.get(`/gallery/${id}`),
    '写真の取得に失敗しました',
  );
  return payload;
}

export async function fetchGalleryStats() {
  const { payload } = await unwrap<GalleryStats>(
    apiClient.get('/gallery/stats'),
    '写真の取得に失敗しました',
  );
  return payload;
}

export async function createGalleryItem(input: GalleryItemInput) {
  return unwrap<GalleryItem>(
    apiClient.post('/gallery', input),
    '写真の保存に失敗しました',
  );
}

export async function updateGalleryItem(
  id: string,
  input: Partial<GalleryItemInput>,
) {
  return unwrap<GalleryItem>(
    apiClient.patch(`/gallery/${id}`, input),
    '写真の保存に失敗しました',
  );
}

export async function hideGalleryItem(id: string) {
  return unwrap<GalleryItem>(
    apiClient.delete(`/gallery/${id}`),
    '写真の保存に失敗しました',
  );
}

export async function hardDeleteGalleryItem(id: string) {
  return unwrap<GalleryItem>(
    apiClient.delete(`/gallery/${id}`, {
      params: { hard: true },
    }),
    '写真の削除に失敗しました',
  );
}

export async function uploadGalleryImage(
  file: File,
  categorySlug?: string,
) {
  const form = new FormData();
  form.append('image', file);
  if (categorySlug) {
    form.append('category_slug', categorySlug);
  }
  return unwrap<{ path: string; url: string }>(
    apiClient.post('/gallery/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    '画像のアップロードに失敗しました',
  );
}

export async function fetchGalleryCategories() {
  const { payload } = await unwrap<{ items: GalleryCategory[] }>(
    apiClient.get('/gallery-categories'),
    'カテゴリーの取得に失敗しました',
  );
  return payload.items;
}

export async function createGalleryCategory(input: GalleryCategoryInput) {
  return unwrap<GalleryCategory>(
    apiClient.post('/gallery-categories', input),
    'カテゴリーの保存に失敗しました',
  );
}

export async function updateGalleryCategory(
  id: string,
  input: Partial<GalleryCategoryInput>,
) {
  return unwrap<GalleryCategory>(
    apiClient.patch(`/gallery-categories/${id}`, input),
    'カテゴリーの保存に失敗しました',
  );
}

export async function deleteGalleryCategory(id: string) {
  return unwrap<{ id: string }>(
    apiClient.delete(`/gallery-categories/${id}`),
    'カテゴリーの保存に失敗しました',
  );
}
