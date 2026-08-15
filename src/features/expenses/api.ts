import { createCrudApi } from '@/lib/createCrudApi';
import { fetchVendors } from '@/features/vendors/api';
import type { Expense, ExpenseInput, VendorOption } from './types';

const crud = createCrudApi<Expense, ExpenseInput>('expenses');

export const fetchExpenses = crud.fetchAll;
export const createExpense = crud.create;
export const updateExpense = crud.update;
export const deleteExpense = crud.remove;

export async function fetchVendorOptions(weddingId: string): Promise<VendorOption[]> {
  const vendors = await fetchVendors(weddingId);
  return vendors
    .map((v) => ({ id: v.id, name: v.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
