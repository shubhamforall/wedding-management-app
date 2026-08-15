import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { EmergencyContactInput, ImportantNumberInput, WeddingInfoInput } from './types';

export const emergencyContactsKey = (weddingId: string) => ['emergency-contacts', weddingId] as const;
export const importantNumbersKey = (weddingId: string) => ['important-numbers', weddingId] as const;

export function useEmergencyContacts(weddingId: string) {
  return useQuery({ queryKey: emergencyContactsKey(weddingId), queryFn: () => api.fetchEmergencyContacts(weddingId) });
}

export function useImportantNumbers(weddingId: string) {
  return useQuery({ queryKey: importantNumbersKey(weddingId), queryFn: () => api.fetchImportantNumbers(weddingId) });
}

export function useUpdateWeddingInfo(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WeddingInfoInput) => api.updateWeddingInfo(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] }),
  });
}

export function useCreateEmergencyContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmergencyContactInput) => api.createEmergencyContact(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emergencyContactsKey(weddingId) }),
  });
}

export function useUpdateEmergencyContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmergencyContactInput }) =>
      api.updateEmergencyContact(weddingId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emergencyContactsKey(weddingId) }),
  });
}

export function useDeleteEmergencyContact(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEmergencyContact(weddingId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emergencyContactsKey(weddingId) }),
  });
}

export function useCreateImportantNumber(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportantNumberInput) => api.createImportantNumber(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: importantNumbersKey(weddingId) }),
  });
}

export function useUpdateImportantNumber(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ImportantNumberInput }) =>
      api.updateImportantNumber(weddingId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: importantNumbersKey(weddingId) }),
  });
}

export function useDeleteImportantNumber(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteImportantNumber(weddingId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: importantNumbersKey(weddingId) }),
  });
}
