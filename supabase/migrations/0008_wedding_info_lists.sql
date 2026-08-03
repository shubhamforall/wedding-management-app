-- =========================================================================
-- 0008_wedding_info_lists.sql
-- ℹ️ Wedding Info sheet's two sub-tables — not yet built in any phase's
-- schema, but Contacts (Phase 9) auto-syncs from these, so they land here.
-- =========================================================================

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  relation text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.important_numbers (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  label text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emergency_contacts_wedding_id_idx on public.emergency_contacts (wedding_id);
create index important_numbers_wedding_id_idx on public.important_numbers (wedding_id);

create trigger emergency_contacts_set_updated_at before update on public.emergency_contacts
  for each row execute function public.set_updated_at();
create trigger important_numbers_set_updated_at before update on public.important_numbers
  for each row execute function public.set_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array['emergency_contacts', 'important_numbers']
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
