import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseInput, VendorOption } from './types';

export async function fetchExpenses(weddingId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('expense_date', { ascending: false })
    .returns<Expense[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchVendorOptions(weddingId: string): Promise<VendorOption[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('wedding_id', weddingId)
    .order('name', { ascending: true })
    .returns<VendorOption[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createExpense(weddingId: string, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Expense creation returned no data.');
  return data as Expense;
}

export async function updateExpense(expenseId: string, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').update(input).eq('id', expenseId).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Expense update returned no data.');
  return data as Expense;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}
