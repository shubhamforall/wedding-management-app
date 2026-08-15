import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { StayArrangementInput } from './types';

export const stayQueryKey = (weddingId: string) => ['stay-arrangements', weddingId] as const;

export function useStayArrangements(weddingId: string) {
  return useQuery({ queryKey: stayQueryKey(weddingId), queryFn: () => api.fetchStayArrangements(weddingId) });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: stayQueryKey(weddingId) });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateStayArrangement(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StayArrangementInput) => api.createStayArrangement(weddingId, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useUpdateStayArrangement(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StayArrangementInput }) =>
      api.updateStayArrangement(weddingId, id, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useDeleteStayArrangement(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteStayArrangement(weddingId, id),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}
