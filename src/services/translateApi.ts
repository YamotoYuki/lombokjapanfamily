import { apiClient } from '@/services/apiClient';

type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

/** Keep each /api/translate call short enough for Render/Gunicorn timeouts. */
const FIELD_BATCH_SIZE = 4;
const BATCH_GAP_MS = 900;

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

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function translateFieldBatch(
  fields: Record<string, string>,
  target: 'en' | 'id',
) {
  const fieldCount = Object.keys(fields).length;
  const timeout = Math.min(180000, 45000 + fieldCount * 25000);
  const { data } = await apiClient.post<
    ApiEnvelope<{ fields: Record<string, string> }>
  >(
    '/translate',
    { fields, target },
    { timeout },
  );
  if (!data.ok || !data.data?.fields) {
    throw new Error(data.message ?? '翻訳に失敗しました');
  }
  return data.data.fields;
}

/** Translate Japanese draft fields to English or Indonesian. */
export async function translateJaFields(
  fields: Record<string, string>,
  target: 'en' | 'id',
) {
  try {
    const compacted = compactFields(fields);
    const entries = Object.entries(compacted);
    if (entries.length === 0) {
      throw new Error('翻訳する日本語の文言を入力してください');
    }

    // Small forms (blog/gallery/announcement/banner): one request.
    // Family profiles can have many fields — batch to avoid worker timeouts
    // and reduce MyMemory burst rate limiting.
    if (entries.length <= FIELD_BATCH_SIZE) {
      return await translateFieldBatch(Object.fromEntries(entries), target);
    }

    const merged: Record<string, string> = {};
    for (let index = 0; index < entries.length; index += FIELD_BATCH_SIZE) {
      if (index > 0) {
        await sleep(BATCH_GAP_MS);
      }
      const batch = Object.fromEntries(
        entries.slice(index, index + FIELD_BATCH_SIZE),
      );
      Object.assign(merged, await translateFieldBatch(batch, target));
    }
    return merged;
  } catch (error) {
    throw new Error(getErrorMessage(error, '翻訳に失敗しました'));
  }
}
