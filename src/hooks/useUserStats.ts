import { useQuery } from '@tanstack/react-query';
import { fetchUserStats } from '@/services/userApi';

export const userStatsKeys = {
  all: ['user-stats'] as const,
};

export function useUserStats(enabled = true) {
  return useQuery({
    queryKey: userStatsKeys.all,
    queryFn: fetchUserStats,
    enabled,
  });
}
