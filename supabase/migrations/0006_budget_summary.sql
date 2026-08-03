-- =========================================================================
-- 0006_budget_summary.sql
-- 💰 Budget sheet: Category / Estimated Budget are the only editable
-- cells (budget_lines table); Actual Expense / Difference / Status /
-- % Used are always derived from Expenses — mirrored here as a view so
-- the client never computes them and can't drift from the source data.
-- =========================================================================

create view public.budget_summary
with (security_invoker = true) as
select
  bl.id,
  bl.wedding_id,
  bl.category,
  bl.estimated_amount,
  coalesce((
    select sum(e.amount) from public.expenses e
    where e.wedding_id = bl.wedding_id and e.category = bl.category
  ), 0) as actual_expense,
  bl.estimated_amount - coalesce((
    select sum(e.amount) from public.expenses e
    where e.wedding_id = bl.wedding_id and e.category = bl.category
  ), 0) as difference,
  case
    when bl.estimated_amount = 0 then 'Not Set'
    when coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = bl.wedding_id and e.category = bl.category), 0) > bl.estimated_amount then 'Over Budget'
    when coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = bl.wedding_id and e.category = bl.category), 0) = bl.estimated_amount then 'On Budget'
    else 'Under Budget'
  end as status,
  case
    when bl.estimated_amount = 0 then 0
    else round(100 * coalesce((select sum(e.amount) from public.expenses e where e.wedding_id = bl.wedding_id and e.category = bl.category), 0) / bl.estimated_amount, 1)
  end as pct_used
from public.budget_lines bl;
