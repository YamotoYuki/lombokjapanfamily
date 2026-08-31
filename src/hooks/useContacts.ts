import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveContact,
  deleteContact,
  fetchContact,
  fetchContacts,
  submitContact,
  updateContact,
} from '@/services/contactApi';
import type { Contact, ContactInput, ContactListParams } from '@/types/contact';

export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: ContactListParams) => ['contacts', 'list', params] as const,
  detail: (id: string) => ['contacts', 'detail', id] as const,
};

export function useContacts(params: ContactListParams = {}, enabled = true) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => fetchContacts(params),
    enabled,
  });
}

export function useContact(id?: string) {
  return useQuery({
    queryKey: contactKeys.detail(id ?? ''),
    queryFn: () => fetchContact(id!),
    enabled: Boolean(id),
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (input: ContactInput) => submitContact(input),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<
        Pick<
          Contact,
          'status' | 'priority' | 'assigned_to' | 'internal_note' | 'responded_at'
        >
      >;
    }) => updateContact(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });
      await queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      });
    },
  });
}

export function useArchiveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}
