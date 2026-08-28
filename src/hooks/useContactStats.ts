import { useQuery } from '@tanstack/react-query';
import { fetchContactStats } from '@/services/contactApi';

export const contactStatsKeys = {
  all: ['contact-stats'] as const,
};

export function useContactStats() {
  return useQuery({
    queryKey: contactStatsKeys.all,
    queryFn: fetchContactStats,
  });
}
