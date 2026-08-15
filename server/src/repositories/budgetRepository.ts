import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

export interface BudgetSummaryRow extends RowDataPacket {
  id: string;
  wedding_id: string;
  category: string;
  estimated_amount: string;
  actual_expense: string;
  difference: string;
  status: 'Not Set' | 'Over Budget' | 'On Budget' | 'Under Budget';
  pct_used: string | null;
}

// Actual expense/difference/status/%used are always derived live from
// `expenses`, never stored — matching the workbook's "don't type into the
// grey formula cells" rule (see HANDOFF.md on budget_summary). This is a
// query, not a cached column, on purpose.
export async function fetchBudgetSummary(weddingId: string): Promise<BudgetSummaryRow[]> {
  const [rows] = await pool.query<BudgetSummaryRow[]>(
    `SELECT
       bl.id,
       bl.wedding_id,
       bl.category,
       bl.estimated_amount,
       COALESCE(e.actual_expense, 0) AS actual_expense,
       bl.estimated_amount - COALESCE(e.actual_expense, 0) AS difference,
       CASE
         WHEN bl.estimated_amount = 0 THEN 'Not Set'
         WHEN COALESCE(e.actual_expense, 0) > bl.estimated_amount THEN 'Over Budget'
         WHEN COALESCE(e.actual_expense, 0) = bl.estimated_amount THEN 'On Budget'
         ELSE 'Under Budget'
       END AS status,
       CASE WHEN bl.estimated_amount = 0 THEN NULL
         ELSE ROUND(COALESCE(e.actual_expense, 0) / bl.estimated_amount * 100, 1)
       END AS pct_used
     FROM budget_lines bl
     LEFT JOIN (
       SELECT category, SUM(amount) AS actual_expense
       FROM expenses
       WHERE wedding_id = ?
       GROUP BY category
     ) e ON e.category = bl.category
     WHERE bl.wedding_id = ?
     ORDER BY bl.category ASC`,
    [weddingId, weddingId]
  );
  return rows;
}

export async function updateBudgetLineAmount(id: string, weddingId: string, estimatedAmount: number): Promise<void> {
  await pool.query('UPDATE budget_lines SET estimated_amount = ? WHERE id = ? AND wedding_id = ?', [
    estimatedAmount,
    id,
    weddingId,
  ]);
}
