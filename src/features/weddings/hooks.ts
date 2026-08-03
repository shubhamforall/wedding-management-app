import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWedding, fetchMyWeddings, type CreateWeddingInput } from './api';

export const weddingsQueryKey = ['weddings'] as const;

export function useMyWeddings() {
  return useQuery({ queryKey: weddingsQueryKey, queryFn: fetchMyWeddings });
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
