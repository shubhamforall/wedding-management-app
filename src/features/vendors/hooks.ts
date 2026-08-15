import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { VendorInput } from './types';

export const vendorsQueryKey = (weddingId: string) => ['vendors', weddingId] as const;

export function useVendors(weddingId: string) {
  return useQuery({ queryKey: vendorsQueryKey(weddingId), queryFn: () => api.fetchVendors(weddingId) });
}

function invalidateVendorDerived(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: vendorsQueryKey(weddingId) });
  // Expenses' vendor dropdown and the Dashboard's vendor-payment KPIs both
  // read from vendors — keep them in sync with any vendor mutation.
  queryClient.invalidateQueries({ queryKey: ['vendor-options', weddingId] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateVendor(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorInput) => api.createVendor(weddingId, input),
    onSuccess: () => invalidateVendorDerived(queryClient, weddingId),
  });
}

export function useUpdateVendor(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VendorInput }) => api.updateVendor(weddingId, id, input),
    onSuccess: () => invalidateVendorDerived(queryClient, weddingId),
  });
}

export function useDeleteVendor(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVendor(weddingId, id),
    onSuccess: () => invalidateVendorDerived(queryClient, weddingId),
  });
}
