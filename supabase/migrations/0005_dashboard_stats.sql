-- =========================================================================
-- 0005_dashboard_stats.sql
-- One view, one query, all 16 Dashboard KPI cards. security_invoker means
-- Postgres applies the *querying user's* RLS to every underlying table
-- referenced here — no separate grant/policy needed on the view itself.
-- =========================================================================

create view public.dashboard_stats
with (security_invoker = true) as
select
  w.id as wedding_id,

  -- Budget
  coalesce((select sum(bl.estimated_amount) from public.budget_lines bl where bl.wedding_id = w.id), 0) as total_budget,
  coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = w.id), 0) as total_expenses,
  coalesce((select sum(bl.estimated_amount) from public.budget_lines bl where bl.wedding_id = w.id), 0)
    - coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = w.id), 0) as remaining_budget,
  case
    when coalesce((select sum(bl.estimated_amount) from public.budget_lines bl where bl.wedding_id = w.id), 0) = 0 then 0
    else round(
      100 * coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = w.id), 0)
      / (select sum(bl.estimated_amount) from public.budget_lines bl where bl.wedding_id = w.id),
      1
    )
  end as budget_utilization_pct,

  -- Guests
  coalesce((select count(*) from public.guests g where g.wedding_id = w.id), 0) as total_families,
  coalesce((select sum(g.total_members) from public.guests g where g.wedding_id = w.id), 0) as total_members,
  coalesce((select count(*) from public.guests g where g.wedding_id = w.id and g.invitation_status <> 'Yes'), 0) as invitations_pending,
  coalesce((select count(*) from public.guests g where g.wedding_id = w.id and g.attending_wedding = true), 0) as attending_wedding,

  -- Tasks
  coalesce((select count(*) from public.tasks t where t.wedding_id = w.id and t.status <> 'Completed'), 0) as pending_tasks,
  coalesce((select count(*) from public.tasks t where t.wedding_id = w.id and t.status <> 'Completed' and t.due_date < current_date), 0) as overdue_tasks,
  case
    when (select count(*) from public.tasks t where t.wedding_id = w.id) = 0 then 0
    else round(
      100.0 * (select count(*) from public.tasks t where t.wedding_id = w.id and t.status = 'Completed')
      / (select count(*) from public.tasks t where t.wedding_id = w.id),
      0
    )
  end as task_progress_pct,
  case
    when (select count(*) from public.shopping_items s where s.wedding_id = w.id) = 0 then 0
    else round(
      100.0 * (select count(*) from public.shopping_items s where s.wedding_id = w.id and s.status = 'Completed')
      / (select count(*) from public.shopping_items s where s.wedding_id = w.id),
      0
    )
  end as shopping_progress_pct,

  -- Vendors / Inventory / Stay
  coalesce((select count(*) from public.vendors v where v.wedding_id = w.id and (v.total_amount - v.advance_paid) > 0), 0) as vendor_payments_pending,
  coalesce((select sum(v.total_amount - v.advance_paid) from public.vendors v where v.wedding_id = w.id), 0) as amount_pending,
  coalesce((select count(*) from public.inventory_items i where i.wedding_id = w.id and coalesce(i.required_qty, 0) > coalesce(i.available_qty, 0)), 0) as inventory_short_items,
  coalesce((select count(*) from public.stay_arrangements sa where sa.wedding_id = w.id), 0) as stay_records

from public.weddings w;
