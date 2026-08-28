import { apiClient } from '@/services/apiClient';
import type { Settings, SettingsUpdateInput } from '@/types/settings';

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

export async function fetchSettings() {
  const { payload } = await unwrap<Settings>(
    apiClient.get('/settings'),
    '通信エラーが発生しました',
  );
  return payload;
}

export async function updateSettings(input: SettingsUpdateInput) {
  const { payload, message } = await unwrap<Settings>(
    apiClient.patch('/settings', input),
    '設定の保存に失敗しました',
  );
  return { settings: payload, message: message ?? '設定を保存しました' };
}

async function uploadAsset(
  path: string,
  file: File,
  fieldName: string,
  fallback: string,
) {
  const form = new FormData();
  form.append(fieldName, file);
  form.append('file', file);
  const { payload, message } = await unwrap<Settings & { upload?: { url: string } }>(
    apiClient.post(path, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    fallback,
  );
  return { settings: payload, message: message ?? '設定を保存しました' };
}

export async function uploadLogo(file: File) {
  return uploadAsset(
    '/settings/upload-logo',
    file,
    'logo',
    'ロゴのアップロードに失敗しました',
  );
}

export async function uploadFavicon(file: File) {
  return uploadAsset(
    '/settings/upload-favicon',
    file,
    'favicon',
    'ファビコンのアップロードに失敗しました',
  );
}

export async function uploadOgImage(file: File) {
  return uploadAsset(
    '/settings/upload-og-image',
    file,
    'og_image',
    'OG画像のアップロードに失敗しました',
  );
}
