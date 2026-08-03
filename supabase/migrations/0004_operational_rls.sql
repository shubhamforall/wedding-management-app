-- =========================================================================
-- 0004_operational_rls.sql
-- RLS for every table added in 0003, all following the same shape:
-- viewers can read, members+ can write, nobody crosses wedding_id.
-- =========================================================================

alter table public.wedding_announcements enable row level security;

create policy "wedding_announcements: select as member" on public.wedding_announcements
  for select using (public.is_wedding_member(wedding_id, 'viewer'));

create policy "wedding_announcements: update as member+" on public.wedding_announcements
  for update using (public.is_wedding_member(wedding_id, 'member'));

do $$
declare
  t text;
begin
  foreach t in array array[
    'budget_lines', 'vendors', 'expenses', 'guests', 'shopping_items',
    'inventory_items', 'stay_arrangements', 'tasks', 'timeline_events',
    'contacts', 'documents'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "%1$s: select as member" on public.%1$s for select using (public.is_wedding_member(wedding_id, ''viewer''))',
      t
    );
    execute format(
      'create policy "%1$s: insert as member+" on public.%1$s for insert with check (public.is_wedding_member(wedding_id, ''member''))',
      t
    );
    execute format(
      'create policy "%1$s: update as member+" on public.%1$s for update using (public.is_wedding_member(wedding_id, ''member''))',
      t
    );
    execute format(
      'create policy "%1$s: delete as member+" on public.%1$s for delete using (public.is_wedding_member(wedding_id, ''member''))',
      t
    );
  end loop;
end $$;
