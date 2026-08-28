import { useQuery } from '@tanstack/react-query';
import { fetchSponsorStats } from '@/services/sponsorApi';

export const sponsorStatsKeys = {
  all: ['sponsor-stats'] as const,
};

export function useSponsorStats() {
  return useQuery({
    queryKey: sponsorStatsKeys.all,
    queryFn: fetchSponsorStats,
  });
}
