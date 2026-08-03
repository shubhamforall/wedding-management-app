import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBudgetSummary, updateEstimatedAmount } from './api';

export const budgetQueryKey = (weddingId: string) => ['budget-summary', weddingId] as const;

export function useBudgetSummary(weddingId: string) {
  return useQuery({ queryKey: budgetQueryKey(weddingId), queryFn: () => fetchBudgetSummary(weddingId) });
}

export function useUpdateEstimatedAmount(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => updateEstimatedAmount(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetQueryKey(weddingId) }),
  });
}
