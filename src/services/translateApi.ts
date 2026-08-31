import { apiClient } from '@/services/apiClient';

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

/** Translate Japanese draft fields to English or Indonesian. */
export async function translateJaFields(
  fields: Record<string, string>,
  target: 'en' | 'id',
) {
  try {
    const { data } = await apiClient.post<
      ApiEnvelope<{ fields: Record<string, string> }>
    >('/translate', { fields, target });
    if (!data.ok || !data.data?.fields) {
      throw new Error(data.message ?? '翻訳に失敗しました');
    }
    return data.data.fields;
  } catch (error) {
    throw new Error(getErrorMessage(error, '翻訳に失敗しました'));
  }
}
