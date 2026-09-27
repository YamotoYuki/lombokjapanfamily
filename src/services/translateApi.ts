import { apiClient } from '@/services/apiClient';

export type TranslateLang = 'ja' | 'en' | 'id';
export type TranslateSource = TranslateLang | 'auto';

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
  source: TranslateSource,
  target: TranslateLang,
) {
  const fieldCount = Object.keys(fields).length;
  const timeout = Math.min(180000, 45000 + fieldCount * 25000);
  const { data } = await apiClient.post<
    ApiEnvelope<{ fields: Record<string, string>; source?: TranslateLang }>
  >(
    '/translate',
    { fields, source, target },
    { timeout },
  );
  if (!data.ok || !data.data?.fields) {
    throw new Error(data.message ?? '翻訳に失敗しました');
  }
  return data.data;
}

/**
 * Translate CMS draft fields between ja/en/id, in any direction.
 * `source` may be an explicit language or 'auto' to let the backend detect
 * it from the text. Returns the translated fields plus the resolved source
 * language (useful to surface what 'auto' detected).
 */
export async function translateFields(
  fields: Record<string, string>,
  options: { source: TranslateSource; target: TranslateLang },
) {
  try {
    const compacted = compactFields(fields);
    const entries = Object.entries(compacted);
    if (entries.length === 0) {
      throw new Error('翻訳する文言を入力してください');
    }

    // Small forms (blog/gallery/announcement/banner): one request.
    // Family profiles can have many fields — batch to avoid worker timeouts
    // and reduce MyMemory burst rate limiting.
    if (entries.length <= FIELD_BATCH_SIZE) {
      return await translateFieldBatch(
        Object.fromEntries(entries),
        options.source,
        options.target,
      );
    }

    const merged: Record<string, string> = {};
    let resolvedSource: TranslateLang | undefined;
    for (let index = 0; index < entries.length; index += FIELD_BATCH_SIZE) {
      if (index > 0) {
        await sleep(BATCH_GAP_MS);
      }
      const batch = Object.fromEntries(
        entries.slice(index, index + FIELD_BATCH_SIZE),
      );
      // Once auto-detect has resolved a language from the first batch,
      // pin subsequent batches to it — every field in a single form is
      // written in the same language, and re-detecting per batch risks an
      // inconsistent source if a later batch's text is ambiguous.
      const batchResult = await translateFieldBatch(
        batch,
        resolvedSource ?? options.source,
        options.target,
      );
      resolvedSource = batchResult.source ?? resolvedSource;
      Object.assign(merged, batchResult.fields);
    }
    return { fields: merged, source: resolvedSource };
  } catch (error) {
    throw new Error(getErrorMessage(error, '翻訳に失敗しました'));
  }
}
