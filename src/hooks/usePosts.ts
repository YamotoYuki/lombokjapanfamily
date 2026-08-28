import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archivePost,
  createPost,
  fetchPost,
  fetchPosts,
  fetchPublicPostBySlug,
  fetchPublicPosts,
  updatePost,
} from '@/services/postApi';
import type { PostInput, PostListParams } from '@/types/post';

export const postKeys = {
  all: ['posts'] as const,
  list: (params: PostListParams) => ['posts', 'list', params] as const,
  publicList: (params: PostListParams) =>
    ['posts', 'public', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
  publicSlug: (slug: string) => ['posts', 'slug', slug] as const,
};

export function usePosts(params: PostListParams = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => fetchPosts(params),
  });
}

export function usePublicPosts(params: PostListParams = {}) {
  return useQuery({
    queryKey: postKeys.publicList(params),
    queryFn: () => fetchPublicPosts(params),
  });
}

export function usePost(id?: string) {
  return useQuery({
    queryKey: postKeys.detail(id ?? ''),
    queryFn: () => fetchPost(id!),
    enabled: Boolean(id),
  });
}

export function usePublicPost(slug?: string) {
  return useQuery({
    queryKey: postKeys.publicSlug(slug ?? ''),
    queryFn: () => fetchPublicPostBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useCreatePost(accessToken?: string | null, userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => createPost(input, accessToken, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useUpdatePost(accessToken?: string | null, userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PostInput> }) =>
      updatePost(id, input, accessToken, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useArchivePost(accessToken?: string | null, userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archivePost(id, accessToken, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
