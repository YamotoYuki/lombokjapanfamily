import { apiClient } from '@/services/apiClient';
import type {
  User,
  UserListParams,
  UserListResponse,
  UserRole,
  UserStats,
  UserStatus,
} from '@/types/user';

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

export async function fetchUsers(params: UserListParams = {}) {
  const { payload } = await unwrap<UserListResponse>(
    apiClient.get('/users', { params }),
    'ユーザーの取得に失敗しました',
  );
  return payload;
}

export async function fetchUser(id: string) {
  const { payload } = await unwrap<User>(
    apiClient.get(`/users/${id}`),
    'ユーザーの取得に失敗しました',
  );
  return payload;
}

export async function fetchUserStats() {
  const { payload } = await unwrap<UserStats>(
    apiClient.get('/users/stats'),
    'ユーザーの取得に失敗しました',
  );
  return payload;
}

export async function fetchCurrentUser() {
  const { payload } = await unwrap<User>(
    apiClient.get('/users/me'),
    'ユーザーの取得に失敗しました',
  );
  return payload;
}

export async function updateMyProfile(input: {
  display_name?: string;
  avatar_url?: string;
}) {
  return unwrap<User>(
    apiClient.patch('/users/me', input),
    'プロフィールの更新に失敗しました',
  );
}

export async function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return unwrap<User>(
    apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    'プロフィール画像のアップロードに失敗しました',
  );
}

export async function updateUserProfile(
  id: string,
  input: { display_name?: string; avatar_url?: string },
) {
  return unwrap<User>(
    apiClient.patch(`/users/${id}`, input),
    'ユーザー更新に失敗しました',
  );
}

export async function updateUserRole(id: string, role: UserRole) {
  return unwrap<User>(
    apiClient.patch(`/users/${id}/role`, { role }),
    'ユーザー更新に失敗しました',
  );
}

export async function updateUserStatus(id: string, status: UserStatus) {
  return unwrap<User>(
    apiClient.patch(`/users/${id}/status`, { status }),
    'ユーザー更新に失敗しました',
  );
}

export async function deleteUser(id: string) {
  return unwrap<User>(
    apiClient.delete(`/users/${id}`),
    'ユーザー更新に失敗しました',
  );
}
