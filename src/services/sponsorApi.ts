import { apiClient } from '@/services/apiClient';
import type {
  Sponsor,
  SponsorInput,
  SponsorListParams,
  SponsorListResponse,
  SponsorStats,
} from '@/types/sponsor';

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

export async function fetchSponsors(params: SponsorListParams = {}) {
  const { payload } = await unwrap<SponsorListResponse>(
    apiClient.get('/sponsors', { params }),
    '案件の取得に失敗しました',
  );
  return payload;
}

export async function fetchSponsor(id: string) {
  const { payload } = await unwrap<Sponsor>(
    apiClient.get(`/sponsors/${id}`),
    '案件の取得に失敗しました',
  );
  return payload;
}

export async function fetchSponsorStats() {
  const { payload } = await unwrap<SponsorStats>(
    apiClient.get('/sponsors/stats'),
    '案件の取得に失敗しました',
  );
  return payload;
}

export async function createSponsor(input: SponsorInput) {
  return unwrap<Sponsor>(
    apiClient.post('/sponsors', input),
    '案件の保存に失敗しました',
  );
}

export async function updateSponsor(id: string, input: Partial<SponsorInput>) {
  return unwrap<Sponsor>(
    apiClient.patch(`/sponsors/${id}`, input),
    '案件の保存に失敗しました',
  );
}

export async function deleteSponsor(id: string) {
  return unwrap<Sponsor>(
    apiClient.delete(`/sponsors/${id}`),
    '案件の保存に失敗しました',
  );
}

export async function uploadSponsorFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return unwrap<{ path: string; url: string }>(
    apiClient.post('/sponsors/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    '添付ファイルのアップロードに失敗しました',
  );
}
