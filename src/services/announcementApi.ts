import { apiClient } from '@/services/apiClient';
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementListParams,
  AnnouncementListResponse,
  AnnouncementStats,
} from '@/types/announcement';

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

export async function fetchAnnouncements(params: AnnouncementListParams = {}) {
  const query: Record<string, string | number | boolean> = {};
  if (params.publishedOnly) query.published_only = true;
  if (params.category) query.category = params.category;
  if (params.featured === true) query.featured = true;
  if (params.featured === false) query.featured = false;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const { payload } = await unwrap<AnnouncementListResponse>(
    apiClient.get('/announcements', {
      params: Object.keys(query).length ? query : undefined,
    }),
    'お知らせの取得に失敗しました',
  );
  return payload;
}

export async function fetchAnnouncement(id: string) {
  const { payload } = await unwrap<Announcement>(
    apiClient.get(`/announcements/${id}`),
    'お知らせの取得に失敗しました',
  );
  return payload;
}

export async function fetchAnnouncementStats() {
  const { payload } = await unwrap<AnnouncementStats>(
    apiClient.get('/announcements/stats'),
    'お知らせの取得に失敗しました',
  );
  return payload;
}

export async function createAnnouncement(input: AnnouncementInput) {
  return unwrap<Announcement>(
    apiClient.post('/announcements', input),
    'お知らせの保存に失敗しました',
  );
}

export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
) {
  return unwrap<Announcement>(
    apiClient.patch(`/announcements/${id}`, input),
    'お知らせの保存に失敗しました',
  );
}

export async function deleteAnnouncement(id: string, hard = false) {
  return unwrap<Announcement>(
    apiClient.delete(`/announcements/${id}`, {
      params: hard ? { hard: true } : undefined,
    }),
    'お知らせの削除に失敗しました',
  );
}
