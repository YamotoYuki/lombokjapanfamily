import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFamilyProfile,
  fetchFamilyProfiles,
  fetchFamilyStats,
  hideFamilyProfile,
  reorderFamilyProfiles,
  updateFamilyProfile,
  uploadFamilyPhoto,
} from '@/services/familyApi';
import type {
  FamilyProfileInput,
  FamilyReorderItem,
} from '@/types/family';

export const familyKeys = {
  all: ['family'] as const,
  list: (visibleOnly: boolean) =>
    [...familyKeys.all, 'list', visibleOnly] as const,
  stats: () => [...familyKeys.all, 'stats'] as const,
};

export function useFamilyProfiles(visibleOnly = false) {
  return useQuery({
    queryKey: familyKeys.list(visibleOnly),
    queryFn: () => fetchFamilyProfiles(visibleOnly),
  });
}

export function useFamilyStats() {
  return useQuery({
    queryKey: familyKeys.stats(),
    queryFn: fetchFamilyStats,
  });
}

export function useCreateFamilyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FamilyProfileInput) => createFamilyProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useUpdateFamilyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<FamilyProfileInput>;
    }) => updateFamilyProfile(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useHideFamilyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideFamilyProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useReorderFamilyProfiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: FamilyReorderItem[]) => reorderFamilyProfiles(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useUploadFamilyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadFamilyPhoto(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}
