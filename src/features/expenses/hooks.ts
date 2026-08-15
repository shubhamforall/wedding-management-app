import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { ExpenseInput } from './types';
import { budgetQueryKey } from '@/features/budget/hooks';

export const expensesQueryKey = (weddingId: string) => ['expenses', weddingId] as const;

export function useExpenses(weddingId: string) {
  return useQuery({ queryKey: expensesQueryKey(weddingId), queryFn: () => api.fetchExpenses(weddingId) });
}

export function useVendorOptions(weddingId: string) {
  return useQuery({ queryKey: ['vendor-options', weddingId], queryFn: () => api.fetchVendorOptions(weddingId) });
}

function invalidateExpenseDerived(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: expensesQueryKey(weddingId) });
  // Budget's Actual Expense / Difference / Status / % Used all derive from
  // expenses, so any expense mutation must also refresh the budget view.
  queryClient.invalidateQueries({ queryKey: budgetQueryKey(weddingId) });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateExpense(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => api.createExpense(weddingId, input),
    onSuccess: () => invalidateExpenseDerived(queryClient, weddingId),
  });
}

export function useUpdateExpense(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => api.updateExpense(weddingId, id, input),
    onSuccess: () => invalidateExpenseDerived(queryClient, weddingId),
  });
}

export function useDeleteExpense(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(weddingId, id),
    onSuccess: () => invalidateExpenseDerived(queryClient, weddingId),
  });
}
