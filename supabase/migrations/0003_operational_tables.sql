-- =========================================================================
-- 0003_operational_tables.sql
-- Every remaining workbook sheet as a table, strict workbook-only field
-- scope (see project memory: no Call Status/Confirmation/Assigned-To/
-- Accommodation/Vehicle/Gift on guests, no vehicle/driver/pickup-drop on
-- stay, no Maps/UPI/Bank/DueDate/Contract on vendors, no EstimatedCost/
-- Store/Bill on shopping, no Category/Unit/Shortfall on inventory).
-- Pulled forward from Phases 4-9 so the Dashboard (Phase 3) has real
-- tables to aggregate from; CRUD UI for these still ships in their own
-- later phases.
-- =========================================================================

-- ---------------------------------------------------------------------
-- wedding_announcements: Dashboard's "Latest Announcement" is a single
-- free-text cell in the real workbook, not a backed list — mirror that,
-- but as its own table (not a weddings column) so any member+ can edit
-- it without needing owner-level access to the wedding row itself.
-- ---------------------------------------------------------------------
create table public.wedding_announcements (
  wedding_id uuid primary key references public.weddings (id) on delete cascade,
  message text,
  updated_by uuid references public.user_profiles (id),
  updated_at timestamptz not null default now()
);

create function public.seed_wedding_announcement()
returns trigger as $$
begin
  insert into public.wedding_announcements (wedding_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_wedding_created_seed_announcement
  after insert on public.weddings
  for each row execute function public.seed_wedding_announcement();

-- ---------------------------------------------------------------------
-- budget_lines (💰 Budget sheet: Category / Estimated Budget)
-- Actual Expense is derived from expenses, never stored.
-- ---------------------------------------------------------------------
create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null,
  estimated_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, category)
);

create index budget_lines_wedding_id_idx on public.budget_lines (wedding_id);
create trigger budget_lines_set_updated_at before update on public.budget_lines
  for each row execute function public.set_updated_at();

create function public.seed_default_budget_lines()
returns trigger as $$
begin
  insert into public.budget_lines (wedding_id, category)
  values
    (new.id, 'Hall'), (new.id, 'Decoration'), (new.id, 'Food'), (new.id, 'Photography'),
    (new.id, 'Invitation'), (new.id, 'Jewellery'), (new.id, 'Shopping'), (new.id, 'Travel'),
    (new.id, 'Accommodation'), (new.id, 'Music'), (new.id, 'Return Gifts'), (new.id, 'Miscellaneous');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_wedding_created_seed_budget
  after insert on public.weddings
  for each row execute function public.seed_default_budget_lines();

-- ---------------------------------------------------------------------
-- vendors (🏪 Vendor Management)
-- ---------------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  category text,
  handled_by text,
  phone text,
  alternate_phone text,
  address text,
  total_amount numeric(12, 2) not null default 0,
  advance_paid numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_wedding_id_idx on public.vendors (wedding_id);
create trigger vendors_set_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- expenses (🧾 Expense Tracker)
-- ---------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  expense_date date not null default current_date,
  category text not null,
  description text,
  vendor_id uuid references public.vendors (id) on delete set null,
  amount numeric(12, 2) not null default 0,
  paid_by text,
  payment_mode text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_wedding_id_idx on public.expenses (wedding_id);
create index expenses_wedding_category_idx on public.expenses (wedding_id, category);
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- guests (👨‍👩‍👧‍👦 Guest Management, family-wise)
-- Function checkboxes are the 3 fixed columns the real workbook has —
-- Engagement / Haldi / Wedding — not the full 6-event set.
-- ---------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  family_name text not null,
  village_city text,
  phone text,
  whatsapp text,
  total_members int not null default 1,
  invitation_status text not null default 'No',
  attending_engagement boolean not null default false,
  attending_haldi boolean not null default false,
  attending_wedding boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guests_wedding_id_idx on public.guests (wedding_id);
create trigger guests_set_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- shopping_items (🛍️ Shopping Tracker)
-- ---------------------------------------------------------------------
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  item text not null,
  category text,
  responsible_person text,
  actual_cost numeric(12, 2) not null default 0,
  status text not null default 'Not Started',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_items_wedding_id_idx on public.shopping_items (wedding_id);
create trigger shopping_items_set_updated_at before update on public.shopping_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- inventory_items (📦 Inventory)
-- ---------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  item text not null,
  required_qty numeric(10, 2),
  available_qty numeric(10, 2),
  responsible_person text,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_wedding_id_idx on public.inventory_items (wedding_id);
create trigger inventory_items_set_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- stay_arrangements (🏨 Stay Arrangement)
-- Workbook header literally reads "Villa" for the place-of-stay column.
-- ---------------------------------------------------------------------
create table public.stay_arrangements (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  guest_name_freeform text,
  villa text,
  address text,
  responsible_person text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stay_arrangements_wedding_id_idx on public.stay_arrangements (wedding_id);
create trigger stay_arrangements_set_updated_at before update on public.stay_arrangements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- tasks (✅ Task Tracker)
-- ---------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  task text not null,
  category text,
  assigned_to text,
  priority text,
  start_date date,
  due_date date,
  status text not null default 'Not Started',
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_wedding_id_idx on public.tasks (wedding_id);
create index tasks_wedding_due_date_idx on public.tasks (wedding_id, due_date);
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- timeline_events (📅 Wedding Timeline)
-- ---------------------------------------------------------------------
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  event_name text not null,
  event_date date,
  event_time time,
  venue text,
  responsible_person text,
  checklist text,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index timeline_events_wedding_id_idx on public.timeline_events (wedding_id);
create trigger timeline_events_set_updated_at before update on public.timeline_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- contacts (📇 Contact Directory)
-- family/vendor rows are auto-synced (source column tags provenance);
-- manual rows are user-entered directly on this sheet.
-- ---------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  type text,
  phone text,
  alternate_phone text,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'auto_family', 'auto_vendor')),
  source_ref_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_wedding_id_idx on public.contacts (wedding_id);
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- documents (📁 Documents)
-- ---------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  document_name text not null,
  category text,
  related_to text,
  storage_path text,
  uploaded_by uuid references public.user_profiles (id),
  date_added date not null default current_date,
  created_at timestamptz not null default now()
);

create index documents_wedding_id_idx on public.documents (wedding_id);
