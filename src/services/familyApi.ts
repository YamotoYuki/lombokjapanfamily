import { apiClient } from '@/services/apiClient';
import type {
  FamilyProfile,
  FamilyProfileInput,
  FamilyReorderItem,
  FamilyStats,
} from '@/types/family';

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

export async function fetchFamilyProfiles(visibleOnly = false) {
  const { payload } = await unwrap<{ items: FamilyProfile[] }>(
    apiClient.get('/family', {
      params: visibleOnly ? { visible_only: true } : undefined,
    }),
    '家族プロフィールの取得に失敗しました',
  );
  return payload.items;
}

export async function fetchFamilyProfile(id: string) {
  const { payload } = await unwrap<FamilyProfile>(
    apiClient.get(`/family/${id}`),
    '家族プロフィールの取得に失敗しました',
  );
  return payload;
}

export async function fetchFamilyStats() {
  const { payload } = await unwrap<FamilyStats>(
    apiClient.get('/family/stats'),
    '家族プロフィールの取得に失敗しました',
  );
  return payload;
}

export async function createFamilyProfile(input: FamilyProfileInput) {
  return unwrap<FamilyProfile>(
    apiClient.post('/family', input),
    '家族プロフィールの保存に失敗しました',
  );
}

export async function updateFamilyProfile(
  id: string,
  input: Partial<FamilyProfileInput>,
) {
  return unwrap<FamilyProfile>(
    apiClient.patch(`/family/${id}`, input),
    '家族プロフィールの保存に失敗しました',
  );
}

export async function hideFamilyProfile(id: string) {
  return unwrap<FamilyProfile>(
    apiClient.delete(`/family/${id}`),
    '家族プロフィールの保存に失敗しました',
  );
}

export async function reorderFamilyProfiles(items: FamilyReorderItem[]) {
  return unwrap<FamilyProfile[]>(
    apiClient.patch('/family/reorder', items),
    '表示順の更新に失敗しました',
  );
}

export async function uploadFamilyPhoto(id: string, file: File) {
  const form = new FormData();
  form.append('photo', file);
  return unwrap<{ path: string; url: string }>(
    apiClient.post(`/family/${id}/upload-photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    '画像のアップロードに失敗しました',
  );
}
