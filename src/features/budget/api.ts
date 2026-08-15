import { api } from '@/lib/api';
import { toSnakeCaseArray } from '@/lib/caseMapping';
import type { BudgetSummaryRow } from './types';

export async function fetchBudgetSummary(weddingId: string): Promise<BudgetSummaryRow[]> {
  const { lines } = await api.get<{ lines: Record<string, unknown>[] }>(`/weddings/${weddingId}/budget-summary`);
  return toSnakeCaseArray<BudgetSummaryRow>(lines);
}

export async function updateEstimatedAmount(weddingId: string, budgetLineId: string, estimatedAmount: number) {
  await api.patch(`/weddings/${weddingId}/budget-lines/${budgetLineId}`, { estimatedAmount });
}
