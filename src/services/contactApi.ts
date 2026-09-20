import { apiClient } from '@/services/apiClient';
import type {
  Contact,
  ContactInput,
  ContactListParams,
  ContactListResponse,
  ContactStats,
} from '@/types/contact';

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

/**
 * Contact-form-specific error copy. error.message is never shown to the
 * visitor here, deliberately — unlike getErrorMessage() above (used by the
 * admin-facing calls below, where a raw technical string is acceptable
 * diagnostic detail), a public form must never surface axios's own English
 * text: "timeout of 60000ms exceeded" for a client timeout, or generic
 * strings like "Request failed with status code 500" whenever the server
 * responded without a usable `message` field. Axios tags exactly which
 * kind of network failure it was via error.code (see
 * node_modules/axios/lib/adapters/xhr.js): 'ECONNABORTED' for a client
 * timeout, everything else that never got a response (CORS block, offline,
 * connection refused, ...) has no response at all. Only a `message` that
 * actually came back from the server — and is a non-empty string — is
 * trusted; anything else falls back to a fixed Japanese message.
 */
function getSubmitErrorMessage(error: unknown): string {
  const fallback =
    'お問い合わせの送信に失敗しました。しばらくしてから再度お試しください。';

  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const maybeAxios = error as {
    code?: string;
    response?: { data?: { message?: unknown } };
  };

  if (maybeAxios.response !== undefined) {
    const serverMessage = maybeAxios.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim() !== '') {
      return serverMessage;
    }
    return fallback;
  }

  if (maybeAxios.code === 'ECONNABORTED') {
    return 'お問い合わせの送信がタイムアウトしました。しばらくしてから再度お試しください。';
  }

  return 'サーバーに接続できませんでした。通信環境をご確認のうえ、再度お試しください。';
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

export async function submitContact(input: ContactInput) {
  const form = new FormData();
  form.append('company_name', input.company_name ?? '');
  form.append('contact_name', input.contact_name);
  form.append('email', input.email);
  form.append('phone', input.phone ?? '');
  form.append('subject', input.subject);
  form.append('message', input.message);
  form.append('contact_type', input.contact_type);
  if (input.cf_turnstile_response) {
    form.append('cf_turnstile_response', input.cf_turnstile_response);
  }
  if (input.attachment) {
    form.append('attachment', input.attachment);
  }

  try {
    // Do not set Content-Type manually — the browser must add the multipart boundary.
    const { data } = await apiClient.post<ApiEnvelope<Contact>>('/contacts', form, {
      timeout: 60000,
    });
    if (!data.ok || !data.data) {
      throw new Error(data.message ?? 'お問い合わせの送信に失敗しました');
    }
    return {
      contact: data.data,
      message: data.message ?? 'お問い合わせを送信しました。',
    };
  } catch (error) {
    throw new Error(getSubmitErrorMessage(error));
  }
}

export async function fetchContacts(params: ContactListParams = {}) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<ContactListResponse>>('/contacts', { params }),
    'お問い合わせ一覧の取得に失敗しました',
  );
  return payload;
}

export async function fetchContact(id: string) {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<Contact>>(`/contacts/${id}`),
    'お問い合わせ詳細の取得に失敗しました',
  );
  return payload;
}

export async function updateContact(
  id: string,
  input: Partial<
    Pick<
      Contact,
      'status' | 'priority' | 'assigned_to' | 'internal_note' | 'responded_at'
    >
  >,
) {
  const { payload, message } = await unwrap(
    apiClient.patch<ApiEnvelope<Contact>>(`/contacts/${id}`, input),
    'ステータス更新に失敗しました',
  );
  return { contact: payload, message };
}

export async function archiveContact(id: string) {
  const { payload, message } = await unwrap(
    apiClient.delete<ApiEnvelope<Contact>>(`/contacts/${id}`),
    'ステータス更新に失敗しました',
  );
  return { contact: payload, message };
}

export async function deleteContact(id: string) {
  const { payload, message } = await unwrap(
    apiClient.delete<ApiEnvelope<Contact>>(`/contacts/${id}`, {
      params: { hard: true },
    }),
    'お問い合わせの削除に失敗しました',
  );
  return { contact: payload, message };
}

export async function fetchContactStats() {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<ContactStats>>('/contacts/stats'),
    'お問い合わせ一覧の取得に失敗しました',
  );
  return payload;
}
