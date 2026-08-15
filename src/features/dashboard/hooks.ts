import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from './api';

export function useDashboardStats(weddingId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', weddingId],
    queryFn: () => fetchDashboardStats(weddingId),
    refetchInterval: 60_000,
  });
}
