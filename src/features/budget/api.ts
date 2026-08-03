import { supabase } from '@/lib/supabase';
import type { BudgetSummaryRow } from './types';

export async function fetchBudgetSummary(weddingId: string): Promise<BudgetSummaryRow[]> {
  const { data, error } = await supabase
    .from('budget_summary')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('category', { ascending: true })
    .returns<BudgetSummaryRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function updateEstimatedAmount(budgetLineId: string, estimatedAmount: number) {
  const { error } = await supabase
    .from('budget_lines')
    .update({ estimated_amount: estimatedAmount })
    .eq('id', budgetLineId);

  if (error) throw error;
}
