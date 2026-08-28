import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteUser,
  fetchUser,
  fetchUsers,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
} from '@/services/userApi';
import type { UserListParams, UserRole, UserStatus } from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => [...userKeys.all, 'list', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export function useUsers(params: UserListParams = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    enabled,
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id!),
    enabled: Boolean(id),
  });
}

function invalidateUsers(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['user-stats'] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
  }
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { display_name?: string; avatar_url?: string };
    }) => updateUserProfile(id, input),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.id),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(id, role),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.id),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      updateUserStatus(id, status),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.id),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => invalidateUsers(queryClient),
  });
}
