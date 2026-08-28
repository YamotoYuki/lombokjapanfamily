import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSettings,
  updateSettings,
  uploadFavicon,
  uploadLogo,
  uploadOgImage,
} from '@/services/settingsApi';
import type { SettingsUpdateInput } from '@/types/settings';

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: fetchSettings,
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsUpdateInput) => updateSettings(input),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.detail(), result.settings);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.detail(), result.settings);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUploadFavicon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadFavicon(file),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.detail(), result.settings);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUploadOgImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadOgImage(file),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.detail(), result.settings);
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
