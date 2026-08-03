import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { ShoppingItemInput } from './types';

export const shoppingQueryKey = (weddingId: string) => ['shopping-items', weddingId] as const;

export function useShoppingItems(weddingId: string) {
  return useQuery({ queryKey: shoppingQueryKey(weddingId), queryFn: () => api.fetchShoppingItems(weddingId) });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: shoppingQueryKey(weddingId) });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ShoppingItemInput) => api.createShoppingItem(weddingId, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useUpdateShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ShoppingItemInput }) => api.updateShoppingItem(id, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useDeleteShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteShoppingItem(id),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}
