export interface DashboardStats {
  wedding_id: string;
  total_budget: number;
  total_expenses: number;
  remaining_budget: number;
  budget_utilization_pct: number;
  total_families: number;
  total_members: number;
  invitations_pending: number;
  attending_wedding: number;
  pending_tasks: number;
  overdue_tasks: number;
  task_progress_pct: number;
  shopping_progress_pct: number;
  vendor_payments_pending: number;
  amount_pending: number;
  inventory_short_items: number;
  stay_records: number;
}

export interface WeddingAnnouncement {
  wedding_id: string;
  message: string | null;
  updated_by: string | null;
  updated_at: string;
}
