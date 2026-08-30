import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncement,
  fetchAnnouncementStats,
  fetchAnnouncements,
  updateAnnouncement,
} from '@/services/announcementApi';
import type {
  AnnouncementInput,
  AnnouncementListParams,
} from '@/types/announcement';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (params: AnnouncementListParams) =>
    [...announcementKeys.all, 'list', params] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
  stats: () => [...announcementKeys.all, 'stats'] as const,
};

export function useAnnouncements(params: AnnouncementListParams = {}) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => fetchAnnouncements(params),
  });
}

export function useAnnouncement(id?: string) {
  const announcementId = id?.trim() || '';
  return useQuery({
    queryKey: announcementKeys.detail(announcementId),
    queryFn: async () => {
      const item = await fetchAnnouncement(announcementId);
      if (item.id !== announcementId) {
        throw new Error('お知らせの取得に失敗しました');
      }
      return item;
    },
    enabled: Boolean(announcementId),
    placeholderData: undefined,
  });
}

export function useAnnouncementStats() {
  return useQuery({
    queryKey: announcementKeys.stats(),
    queryFn: fetchAnnouncementStats,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => createAnnouncement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<AnnouncementInput>;
    }) => updateAnnouncement(id, input),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        announcementKeys.detail(variables.id),
        result.payload,
      );
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
      deleteAnnouncement(id, hard),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}
