import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGalleryItem,
  fetchGallery,
  fetchGalleryStats,
  hideGalleryItem,
  updateGalleryItem,
  uploadGalleryImage,
} from '@/services/galleryApi';
import type { GalleryItemInput, GalleryListParams } from '@/types/gallery';

export const galleryKeys = {
  all: ['gallery'] as const,
  list: (params: GalleryListParams) =>
    [...galleryKeys.all, 'list', params] as const,
  stats: () => [...galleryKeys.all, 'stats'] as const,
};

export function useGallery(params: GalleryListParams = {}) {
  return useQuery({
    queryKey: galleryKeys.list(params),
    queryFn: () => fetchGallery(params),
  });
}

export function useGalleryStats() {
  return useQuery({
    queryKey: galleryKeys.stats(),
    queryFn: fetchGalleryStats,
  });
}

export function useCreateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GalleryItemInput) => createGalleryItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}

export function useUpdateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<GalleryItemInput>;
    }) => updateGalleryItem(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}

export function useHideGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideGalleryItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}

export function useUploadGalleryImage() {
  return useMutation({
    mutationFn: ({
      file,
      categorySlug,
    }: {
      file: File;
      categorySlug?: string;
    }) => uploadGalleryImage(file, categorySlug),
  });
}
