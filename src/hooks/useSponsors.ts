import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSponsor,
  deleteSponsor,
  fetchSponsor,
  fetchSponsors,
  updateSponsor,
  uploadSponsorFile,
} from '@/services/sponsorApi';
import type { SponsorInput, SponsorListParams } from '@/types/sponsor';

export const sponsorKeys = {
  all: ['sponsors'] as const,
  list: (params: SponsorListParams) =>
    [...sponsorKeys.all, 'list', params] as const,
  detail: (id: string) => [...sponsorKeys.all, 'detail', id] as const,
};

function invalidateSponsorQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  void queryClient.invalidateQueries({ queryKey: sponsorKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['sponsor-stats'] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: sponsorKeys.detail(id) });
  }
}

export function useSponsors(params: SponsorListParams = {}) {
  return useQuery({
    queryKey: sponsorKeys.list(params),
    queryFn: () => fetchSponsors(params),
  });
}

export function useSponsor(id?: string) {
  return useQuery({
    queryKey: sponsorKeys.detail(id ?? ''),
    queryFn: () => fetchSponsor(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SponsorInput) => createSponsor(input),
    onSuccess: () => {
      invalidateSponsorQueries(queryClient);
    },
  });
}

export function useUpdateSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SponsorInput>;
    }) => updateSponsor(id, input),
    onSuccess: (_data, variables) => {
      invalidateSponsorQueries(queryClient, variables.id);
    },
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSponsor(id),
    onSuccess: () => {
      invalidateSponsorQueries(queryClient);
    },
  });
}

export function useUploadSponsorFile() {
  return useMutation({
    mutationFn: (file: File) => uploadSponsorFile(file),
  });
}
