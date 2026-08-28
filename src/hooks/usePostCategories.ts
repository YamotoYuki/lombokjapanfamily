import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPostCategory,
  deletePostCategory,
  fetchPostCategories,
  updatePostCategory,
} from '@/services/postApi';
import type { PostCategory } from '@/types/post';

export const categoryKeys = {
  all: ['post-categories'] as const,
};

export function usePostCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchPostCategories,
  });
}

export function useCreatePostCategory(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Pick<PostCategory, 'name' | 'slug' | 'description'>,
    ) => createPostCategory(input, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdatePostCategory(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Pick<PostCategory, 'name' | 'slug' | 'description'>>;
    }) => updatePostCategory(id, input, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeletePostCategory(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePostCategory(id, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
