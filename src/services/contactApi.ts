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
  if (input.attachment) {
    form.append('attachment', input.attachment);
  }

  try {
    const { data } = await apiClient.post<ApiEnvelope<Contact>>(
      '/contacts',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      },
    );
    if (!data.ok || !data.data) {
      throw new Error(data.message ?? 'お問い合わせの送信に失敗しました');
    }
    return {
      contact: data.data,
      message: data.message ?? 'お問い合わせを送信しました。',
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'お問い合わせの送信に失敗しました'),
    );
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

export async function fetchContactStats() {
  const { payload } = await unwrap(
    apiClient.get<ApiEnvelope<ContactStats>>('/contacts/stats'),
    'お問い合わせ一覧の取得に失敗しました',
  );
  return payload;
}
