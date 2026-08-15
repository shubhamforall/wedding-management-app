import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { InventoryItemInput } from './types';

export const inventoryQueryKey = (weddingId: string) => ['inventory-items', weddingId] as const;

export function useInventoryItems(weddingId: string) {
  return useQuery({ queryKey: inventoryQueryKey(weddingId), queryFn: () => api.fetchInventoryItems(weddingId) });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: inventoryQueryKey(weddingId) });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateInventoryItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InventoryItemInput) => api.createInventoryItem(weddingId, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useUpdateInventoryItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryItemInput }) =>
      api.updateInventoryItem(weddingId, id, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useDeleteInventoryItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInventoryItem(weddingId, id),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}
