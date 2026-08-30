import { apiClient } from '@/services/apiClient';
import type {
  NotificationBanner,
  NotificationBannerInput,
} from '@/types/notificationBanner';

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

export async function fetchActiveNotificationBanner() {
  try {
    const { data } = await apiClient.get<ApiEnvelope<NotificationBanner | null>>(
      '/notification-banners/active',
    );
    if (!data.ok) {
      throw new Error(data.message ?? '通知バナーの取得に失敗しました');
    }
    return data.data ?? null;
  } catch (error) {
    throw new Error(getErrorMessage(error, '通知バナーの取得に失敗しました'));
  }
}

export async function fetchNotificationBanners(params?: {
  activeOnly?: boolean;
}) {
  const query: Record<string, string | boolean> = {};
  if (params?.activeOnly) query.active_only = true;
  const { payload } = await unwrap<{ items: NotificationBanner[] }>(
    apiClient.get('/notification-banners', {
      params: Object.keys(query).length ? query : undefined,
    }),
    '通知バナーの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchNotificationBanner(id: string) {
  const { payload } = await unwrap<NotificationBanner>(
    apiClient.get(`/notification-banners/${id}`),
    '通知バナーの取得に失敗しました',
  );
  return payload;
}

export async function createNotificationBanner(input: NotificationBannerInput) {
  return unwrap<NotificationBanner>(
    apiClient.post('/notification-banners', input),
    '通知バナーの保存に失敗しました',
  );
}

export async function updateNotificationBanner(
  id: string,
  input: Partial<NotificationBannerInput>,
) {
  return unwrap<NotificationBanner>(
    apiClient.patch(`/notification-banners/${id}`, input),
    '通知バナーの保存に失敗しました',
  );
}

export async function deleteNotificationBanner(id: string) {
  return unwrap<NotificationBanner>(
    apiClient.delete(`/notification-banners/${id}`),
    '通知バナーの削除に失敗しました',
  );
}
