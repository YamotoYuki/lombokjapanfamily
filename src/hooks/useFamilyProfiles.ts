import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFamilyProfile,
  fetchFamilyProfile,
  fetchFamilyProfiles,
  fetchFamilyStats,
  hideFamilyProfile,
  reorderFamilyProfiles,
  updateFamilyProfile,
  uploadFamilyPhoto,
} from '@/services/familyApi';
import type {
  FamilyListParams,
  FamilyProfileInput,
  FamilyReorderItem,
} from '@/types/family';

export const familyKeys = {
  all: ['family'] as const,
  list: (params: FamilyListParams) =>
    [...familyKeys.all, 'list', params] as const,
  detail: (id: string) => [...familyKeys.all, 'detail', id] as const,
  stats: () => [...familyKeys.all, 'stats'] as const,
};

function normalizeListParams(
  visibleOnlyOrParams: boolean | FamilyListParams = false,
): FamilyListParams {
  if (typeof visibleOnlyOrParams === 'boolean') {
    return { visibleOnly: visibleOnlyOrParams };
  }
  return visibleOnlyOrParams;
}

export function useFamilyProfiles(
  visibleOnlyOrParams: boolean | FamilyListParams = false,
) {
  const params = normalizeListParams(visibleOnlyOrParams);
  return useQuery({
    queryKey: familyKeys.list(params),
    queryFn: () => fetchFamilyProfiles(params),
  });
}

export function useFamilyProfile(id?: string) {
  const profileId = id?.trim() || '';
  return useQuery({
    queryKey: familyKeys.detail(profileId),
    queryFn: async () => {
      const profile = await fetchFamilyProfile(profileId);
      // Guard against mismatched payloads so a prior member never renders.
      if (profile.id !== profileId) {
        throw new Error('家族プロフィールの取得に失敗しました');
      }
      return profile;
    },
    enabled: Boolean(profileId),
    // Never reuse another member's cached row while the id is changing.
    placeholderData: undefined,
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
    onSuccess: (result, variables) => {
      queryClient.setQueryData(familyKeys.detail(variables.id), result.payload);
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
