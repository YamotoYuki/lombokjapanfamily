import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPostTag, fetchPostTags } from '@/services/postApi';
import type { PostTag } from '@/types/post';

export const tagKeys = {
  all: ['post-tags'] as const,
};

export function usePostTags() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: fetchPostTags,
  });
}

export function useCreatePostTag(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<PostTag, 'name' | 'slug'>) =>
      createPostTag(input, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}
