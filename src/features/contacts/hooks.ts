import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { ManualContactInput } from './types';

export function useFamilyEmergencyContacts(weddingId: string) {
  return useQuery({ queryKey: ['contacts-family', weddingId], queryFn: () => api.fetchFamilyEmergencyContacts(weddingId) });
}

export function useVendorContacts(weddingId: string) {
  return useQuery({ queryKey: ['contacts-vendors', weddingId], queryFn: () => api.fetchVendorContacts(weddingId) });
}

export const manualContactsKey = (weddingId: string) => ['contacts-manual', weddingId] as const;

export function useManualContacts(weddingId: string) {
  return useQuery({ queryKey: manualContactsKey(weddingId), queryFn: () => api.fetchManualContacts(weddingId) });
}

export function useCreateManualContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualContactInput) => api.createManualContact(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualContactsKey(weddingId) }),
  });
}

export function useUpdateManualContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ManualContactInput }) =>
      api.updateManualContact(weddingId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualContactsKey(weddingId) }),
  });
}

export function useDeleteManualContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteManualContact(weddingId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualContactsKey(weddingId) }),
  });
}
