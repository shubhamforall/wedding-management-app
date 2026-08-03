import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { GuestInput } from './types';

export const guestsQueryKey = (weddingId: string) => ['guests', weddingId] as const;

export function useGuests(weddingId: string) {
  return useQuery({ queryKey: guestsQueryKey(weddingId), queryFn: () => api.fetchGuests(weddingId) });
}

export function useCreateGuest(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GuestInput) => api.createGuest(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guestsQueryKey(weddingId) }),
  });
}

export function useUpdateGuest(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GuestInput }) => api.updateGuest(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guestsQueryKey(weddingId) }),
  });
}

export function useDeleteGuest(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGuest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guestsQueryKey(weddingId) }),
  });
}
