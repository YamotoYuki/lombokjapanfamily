import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchHomeVideos,
  fetchVideos,
  hideVideo,
  syncVideosFromYouTube,
  updateVideo,
} from '@/services/videoApi';
import type { VideoListParams, VideoUpdatePayload } from '@/types/video';

export const videoKeys = {
  all: ['videos'] as const,
  list: (params: VideoListParams) => ['videos', 'list', params] as const,
  home: ['videos', 'home'] as const,
};

export function useVideos(params: VideoListParams = {}) {
  return useQuery({
    queryKey: videoKeys.list(params),
    queryFn: () => fetchVideos(params),
  });
}

export function useHomeVideos() {
  return useQuery({
    queryKey: videoKeys.home,
    queryFn: fetchHomeVideos,
  });
}

export function useSyncVideos(accessToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncVideosFromYouTube(accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
}

export function useUpdateVideo(accessToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VideoUpdatePayload }) =>
      updateVideo(id, payload, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
}

export function useHideVideo(accessToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hideVideo(id, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
}
