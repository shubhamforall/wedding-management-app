import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWedding, deleteWedding, fetchMyPendingInvitations, fetchMyWeddings, type CreateWeddingInput } from './api';

export const weddingsQueryKey = ['weddings'] as const;
export const myPendingInvitationsQueryKey = ['my-pending-invitations'] as const;

export function useMyWeddings() {
  return useQuery({ queryKey: weddingsQueryKey, queryFn: fetchMyWeddings });
}

export function useMyPendingInvitations() {
  return useQuery({ queryKey: myPendingInvitationsQueryKey, queryFn: fetchMyPendingInvitations });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeddingInput) => createWedding(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weddingsQueryKey });
    },
  });
}

export function useDeleteWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weddingId: string) => deleteWedding(weddingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weddingsQueryKey });
    },
  });
}
