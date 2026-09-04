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

/** Drop blank values so MyMemory is not called for empty CMS fields. */
function compactFields(fields: Record<string, string>) {
  const next: Record<string, string> = {};
  Object.entries(fields).forEach(([key, value]) => {
    const text = value.trim();
    if (text) next[key] = text;
  });
  return next;
}

/** Translate Japanese draft fields to English or Indonesian. */
export async function translateJaFields(
  fields: Record<string, string>,
  target: 'en' | 'id',
) {
  try {
    const compacted = compactFields(fields);
    const { data } = await apiClient.post<
      ApiEnvelope<{ fields: Record<string, string> }>
    >(
      '/translate',
      { fields: compacted, target },
      {
        // Family profiles can send many fields; MyMemory is sequential.
        timeout: 180000,
      },
    );
    if (!data.ok || !data.data?.fields) {
      throw new Error(data.message ?? '翻訳に失敗しました');
    }
    return data.data.fields;
  } catch (error) {
    throw new Error(getErrorMessage(error, '翻訳に失敗しました'));
  }
}
