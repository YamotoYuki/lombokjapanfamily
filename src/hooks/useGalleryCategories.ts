import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGalleryCategory,
  deleteGalleryCategory,
  fetchGalleryCategories,
  updateGalleryCategory,
} from '@/services/galleryApi';
import type { GalleryCategoryInput } from '@/types/gallery';
import { galleryKeys } from '@/hooks/useGallery';

export const galleryCategoryKeys = {
  all: ['gallery-categories'] as const,
  list: () => [...galleryCategoryKeys.all, 'list'] as const,
};

export function useGalleryCategories() {
  return useQuery({
    queryKey: galleryCategoryKeys.list(),
    queryFn: fetchGalleryCategories,
  });
}

export function useCreateGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GalleryCategoryInput) => createGalleryCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: galleryCategoryKeys.all,
      });
    },
  });
}

export function useUpdateGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<GalleryCategoryInput>;
    }) => updateGalleryCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: galleryCategoryKeys.all,
      });
    },
  });
}

export function useDeleteGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGalleryCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: galleryCategoryKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}
