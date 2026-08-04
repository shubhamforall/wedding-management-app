import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListType } from '@/types/database';
import * as api from './api';

// Must match the exact key useListOptions (src/hooks/useListOptions.ts) uses —
// every dropdown across the app reads through that hook, so invalidating
// this key here is what makes edits made in Settings show up live elsewhere.
const listOptionsKey = (weddingId: string, listType: ListType) => ['list-options', weddingId, listType] as const;

export function useSettingsListOptions(weddingId: string, listType: ListType) {
  return useQuery({
    queryKey: listOptionsKey(weddingId, listType),
    queryFn: () => api.fetchListOptions(weddingId, listType),
  });
}

export function useCreateListOption(weddingId: string, listType: ListType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ value, sortOrder }: { value: string; sortOrder: number }) =>
      api.createListOption(weddingId, listType, value, sortOrder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptionsKey(weddingId, listType) }),
  });
}

export function useUpdateListOptionValue(weddingId: string, listType: ListType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api.updateListOptionValue(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptionsKey(weddingId, listType) }),
  });
}

export function useReorderListOptions(weddingId: string, listType: ListType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      await Promise.all(updates.map((u) => api.updateListOptionOrder(u.id, u.sort_order)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptionsKey(weddingId, listType) }),
  });
}

export function useDeleteListOption(weddingId: string, listType: ListType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteListOption(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptionsKey(weddingId, listType) }),
  });
}
