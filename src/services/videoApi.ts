import { apiClient } from '@/services/apiClient';
import type {
  ChannelStats,
  Video,
  VideoListParams,
  VideoListResponse,
  VideoSyncResponse,
  VideoUpdatePayload,
} from '@/types/video';

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

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>, fallback: string) {
  try {
    const { data } = await promise;
    if (!data.ok || data.data === undefined) {
      throw new Error(data.message ?? fallback);
    }
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export async function fetchVideos(params: VideoListParams = {}) {
  return unwrap(
    apiClient.get<ApiEnvelope<VideoListResponse>>('/videos', { params }),
    '動画一覧の取得に失敗しました。',
  );
}

export async function fetchVideo(id: string) {
  return unwrap(
    apiClient.get<ApiEnvelope<Video>>(`/videos/${id}`),
    '動画の取得に失敗しました。',
  );
}

export async function fetchFeaturedVideos() {
  return unwrap(
    apiClient.get<ApiEnvelope<VideoListResponse>>('/videos/featured'),
    'おすすめ動画の取得に失敗しました。',
  );
}

export async function fetchHomeVideos() {
  return unwrap(
    apiClient.get<ApiEnvelope<VideoListResponse>>('/videos/home'),
    'トップページ動画の取得に失敗しました。',
  );
}

export async function fetchChannelStats() {
  return unwrap(
    apiClient.get<ApiEnvelope<ChannelStats>>('/videos/channel-stats'),
    'チャンネル統計の取得に失敗しました。',
  );
}

export async function syncVideosFromYouTube(accessToken?: string | null) {
  const authHeaders = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined;

  // Prefer admin path; fall back to legacy /videos/sync for compatibility.
  try {
    return await unwrap(
      apiClient.post<ApiEnvelope<VideoSyncResponse>>(
        '/admin/videos/sync',
        {},
        authHeaders,
      ),
      'YouTube同期に失敗しました。',
    );
  } catch (primaryError) {
    try {
      return await unwrap(
        apiClient.post<ApiEnvelope<VideoSyncResponse>>(
          '/videos/sync',
          {},
          authHeaders,
        ),
        'YouTube同期に失敗しました。',
      );
    } catch {
      throw primaryError instanceof Error
        ? primaryError
        : new Error('YouTube同期に失敗しました。');
    }
  }
}

export async function updateVideo(
  id: string,
  payload: VideoUpdatePayload,
  accessToken?: string | null,
) {
  return unwrap(
    apiClient.patch<ApiEnvelope<Video>>(
      `/videos/${id}`,
      payload,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    ),
    '動画の更新に失敗しました。',
  );
}

export async function hideVideo(id: string, accessToken?: string | null) {
  return unwrap(
    apiClient.delete<ApiEnvelope<Video>>(
      `/videos/${id}`,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    ),
    '動画の非公開処理に失敗しました。',
  );
}
