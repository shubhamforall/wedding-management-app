export interface Expense {
  id: string;
  wedding_id: string;
  expense_date: string;
  category: string;
  description: string | null;
  vendor_id: string | null;
  amount: number;
  paid_by: string | null;
  payment_mode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  expense_date: string;
  category: string;
  description: string | null;
  vendor_id: string | null;
  amount: number;
  paid_by: string | null;
  payment_mode: string | null;
  notes: string | null;
}

export interface VendorOption {
  id: string;
  name: string;
}
