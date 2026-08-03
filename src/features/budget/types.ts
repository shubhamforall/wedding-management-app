export interface BudgetSummaryRow {
  id: string;
  wedding_id: string;
  category: string;
  estimated_amount: number;
  actual_expense: number;
  difference: number;
  status: 'Not Set' | 'Over Budget' | 'On Budget' | 'Under Budget';
  pct_used: number;
}
