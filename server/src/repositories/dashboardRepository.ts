import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

export interface DashboardStatsRow extends RowDataPacket {
  total_budget: string;
  total_expenses: string;
  remaining_budget: string;
  budget_utilization_pct: string | null;
  total_families: number;
  total_members: number;
  invitations_pending: number;
  attending_wedding: number;
  pending_tasks: number;
  overdue_tasks: number;
  task_progress_pct: string | null;
  shopping_progress_pct: string | null;
  vendor_payments_pending: number;
  amount_pending: string;
  inventory_short_items: number;
  stay_records: number;
}

// Same 16-KPI aggregation as the old dashboard_stats Postgres view, ported
// to a single parameterized query instead of a MySQL view — see
// MIGRATION_ANALYSIS.md Section C on why this belongs in the repository
// layer rather than a view (the view's RLS-dependent security model has no
// MySQL equivalent; tenant scoping happens via requireWeddingMember before
// this ever runs, same as every other query here).
export async function fetchDashboardStats(weddingId: string): Promise<DashboardStatsRow> {
  const [rows] = await pool.query<DashboardStatsRow[]>(
    `SELECT
       (SELECT COALESCE(SUM(estimated_amount), 0) FROM budget_lines WHERE wedding_id = ?) AS total_budget,
       (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE wedding_id = ?) AS total_expenses,
       (SELECT COALESCE(SUM(estimated_amount), 0) FROM budget_lines WHERE wedding_id = ?)
         - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE wedding_id = ?) AS remaining_budget,
       CASE WHEN (SELECT COALESCE(SUM(estimated_amount), 0) FROM budget_lines WHERE wedding_id = ?) = 0 THEN NULL
         ELSE ROUND(
           (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE wedding_id = ?)
           / (SELECT SUM(estimated_amount) FROM budget_lines WHERE wedding_id = ?) * 100, 1)
       END AS budget_utilization_pct,

       (SELECT COUNT(*) FROM guests WHERE wedding_id = ?) AS total_families,
       (SELECT COALESCE(SUM(total_members), 0) FROM guests WHERE wedding_id = ?) AS total_members,
       (SELECT COUNT(*) FROM wedding_invitations WHERE wedding_id = ? AND status = 'pending') AS invitations_pending,
       (SELECT COUNT(*) FROM guests WHERE wedding_id = ? AND attending_wedding = 1) AS attending_wedding,

       (SELECT COUNT(*) FROM tasks WHERE wedding_id = ? AND status != 'Completed') AS pending_tasks,
       (SELECT COUNT(*) FROM tasks WHERE wedding_id = ? AND status != 'Completed' AND due_date IS NOT NULL AND due_date < CURDATE()) AS overdue_tasks,
       CASE WHEN (SELECT COUNT(*) FROM tasks WHERE wedding_id = ?) = 0 THEN NULL
         ELSE ROUND(
           (SELECT COUNT(*) FROM tasks WHERE wedding_id = ? AND status = 'Completed')
           / (SELECT COUNT(*) FROM tasks WHERE wedding_id = ?) * 100, 1)
       END AS task_progress_pct,

       CASE WHEN (SELECT COUNT(*) FROM shopping_items WHERE wedding_id = ?) = 0 THEN NULL
         ELSE ROUND(
           (SELECT COUNT(*) FROM shopping_items WHERE wedding_id = ? AND status = 'Completed')
           / (SELECT COUNT(*) FROM shopping_items WHERE wedding_id = ?) * 100, 1)
       END AS shopping_progress_pct,

       (SELECT COUNT(*) FROM vendors WHERE wedding_id = ? AND advance_paid < total_amount) AS vendor_payments_pending,
       (SELECT COALESCE(SUM(total_amount - advance_paid), 0) FROM vendors WHERE wedding_id = ?) AS amount_pending,
       (SELECT COUNT(*) FROM inventory_items WHERE wedding_id = ? AND available_qty IS NOT NULL AND required_qty IS NOT NULL AND available_qty < required_qty) AS inventory_short_items,
       (SELECT COUNT(*) FROM stay_arrangements WHERE wedding_id = ?) AS stay_records
    `,
    Array(23).fill(weddingId)
  );
  return rows[0]!;
}
