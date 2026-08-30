import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNotificationBanner,
  deleteNotificationBanner,
  fetchActiveNotificationBanner,
  fetchNotificationBanner,
  fetchNotificationBanners,
  updateNotificationBanner,
} from '@/services/notificationBannerApi';
import type { NotificationBannerInput } from '@/types/notificationBanner';

export const notificationBannerKeys = {
  all: ['notification-banners'] as const,
  list: (params?: { activeOnly?: boolean }) =>
    [...notificationBannerKeys.all, 'list', params ?? {}] as const,
  active: () => [...notificationBannerKeys.all, 'active'] as const,
  detail: (id: string) =>
    [...notificationBannerKeys.all, 'detail', id] as const,
};

export function useActiveNotificationBanner() {
  return useQuery({
    queryKey: notificationBannerKeys.active(),
    queryFn: fetchActiveNotificationBanner,
  });
}

export function useNotificationBanners(params?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: notificationBannerKeys.list(params),
    queryFn: () => fetchNotificationBanners(params),
  });
}

export function useNotificationBanner(id?: string) {
  const bannerId = id?.trim() || '';
  return useQuery({
    queryKey: notificationBannerKeys.detail(bannerId),
    queryFn: async () => {
      const item = await fetchNotificationBanner(bannerId);
      if (item.id !== bannerId) {
        throw new Error('通知バナーの取得に失敗しました');
      }
      return item;
    },
    enabled: Boolean(bannerId),
    placeholderData: undefined,
  });
}

export function useCreateNotificationBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NotificationBannerInput) =>
      createNotificationBanner(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationBannerKeys.all,
      });
    },
  });
}

export function useUpdateNotificationBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<NotificationBannerInput>;
    }) => updateNotificationBanner(id, input),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        notificationBannerKeys.detail(variables.id),
        result.payload,
      );
      void queryClient.invalidateQueries({
        queryKey: notificationBannerKeys.all,
      });
    },
  });
}

export function useDeleteNotificationBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotificationBanner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationBannerKeys.all,
      });
    },
  });
}
