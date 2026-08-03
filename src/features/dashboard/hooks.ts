import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAnnouncement, fetchDashboardStats, updateAnnouncement } from './api';

export function useDashboardStats(weddingId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', weddingId],
    queryFn: () => fetchDashboardStats(weddingId),
    refetchInterval: 60_000,
  });
}

export function useAnnouncement(weddingId: string) {
  return useQuery({
    queryKey: ['announcement', weddingId],
    queryFn: () => fetchAnnouncement(weddingId),
  });
}

export function useUpdateAnnouncement(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => updateAnnouncement(weddingId, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcement', weddingId] }),
  });
}
