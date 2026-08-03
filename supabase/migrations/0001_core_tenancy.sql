-- =========================================================================
-- 0001_core_tenancy.sql
-- Core multi-tenant foundation: user profiles, weddings, membership,
-- invitations, and the per-wedding configurable dropdown lists.
-- =========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- user_profiles: 1:1 shadow of auth.users, auto-created on signup
-- ---------------------------------------------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- weddings
-- ---------------------------------------------------------------------
create type public.wedding_side as enum ('groom', 'bride', 'both');

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bride_name text not null,
  groom_name text not null,
  wedding_date date,
  reception_date date,
  venue text,
  address text,
  wedding_side public.wedding_side not null default 'both',
  owner_id uuid not null references public.user_profiles (id),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_owner_id_idx on public.weddings (owner_id);

-- ---------------------------------------------------------------------
-- wedding_members
-- ---------------------------------------------------------------------
create type public.wedding_role as enum ('owner', 'member', 'viewer');
create type public.member_status as enum ('active', 'removed');

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  role public.wedding_role not null default 'member',
  status public.member_status not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id)
);

create index wedding_members_wedding_id_idx on public.wedding_members (wedding_id);
create index wedding_members_user_id_idx on public.wedding_members (user_id);

-- ---------------------------------------------------------------------
-- wedding_invitations
-- ---------------------------------------------------------------------
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  email citext not null,
  role public.wedding_role not null default 'member',
  token uuid not null default gen_random_uuid() unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references public.user_profiles (id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index wedding_invitations_wedding_id_idx on public.wedding_invitations (wedding_id);
create index wedding_invitations_email_idx on public.wedding_invitations (email);
create unique index wedding_invitations_pending_unique
  on public.wedding_invitations (wedding_id, email)
  where status = 'pending';

-- ---------------------------------------------------------------------
-- list_options: replaces the workbook's ⚙️ Settings sheet, per wedding
-- ---------------------------------------------------------------------
create table public.list_options (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  list_type text not null,
  value text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index list_options_wedding_type_idx on public.list_options (wedding_id, list_type);
create unique index list_options_unique_value
  on public.list_options (wedding_id, list_type, value);

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger weddings_set_updated_at
  before update on public.weddings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Owner auto-membership: whoever creates a wedding becomes its owner
-- ---------------------------------------------------------------------
create function public.handle_new_wedding()
returns trigger as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_wedding_created
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();

-- ---------------------------------------------------------------------
-- Guard: prevent removing the last active owner of a wedding
-- ---------------------------------------------------------------------
create function public.guard_last_owner()
returns trigger as $$
declare
  remaining_owners int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and (new.role <> 'owner' or new.status <> 'active')) then
    select count(*) into remaining_owners
    from public.wedding_members
    where wedding_id = old.wedding_id
      and role = 'owner'
      and status = 'active'
      and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'Cannot remove the last owner of a wedding. Transfer ownership first.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger wedding_members_guard_last_owner
  before update or delete on public.wedding_members
  for each row execute function public.guard_last_owner();

-- ---------------------------------------------------------------------
-- Seed list_options with workbook Settings defaults on wedding creation
-- ---------------------------------------------------------------------
create function public.seed_default_list_options()
returns trigger as $$
begin
  insert into public.list_options (wedding_id, list_type, value, sort_order)
  select new.id, list_type, value, sort_order
  from (values
    ('family_members', 'Father', 1), ('family_members', 'Mother', 2), ('family_members', 'Brother', 3),
    ('family_members', 'Sister', 4), ('family_members', 'Uncle', 5), ('family_members', 'Aunt', 6),
    ('family_members', 'Cousin', 7), ('family_members', 'Self', 8), ('family_members', 'Other', 9),

    ('budget_category', 'Hall', 1), ('budget_category', 'Decoration', 2), ('budget_category', 'Food', 3),
    ('budget_category', 'Photography', 4), ('budget_category', 'Invitation', 5), ('budget_category', 'Jewellery', 6),
    ('budget_category', 'Shopping', 7), ('budget_category', 'Travel', 8), ('budget_category', 'Accommodation', 9),
    ('budget_category', 'Music', 10), ('budget_category', 'Return Gifts', 11), ('budget_category', 'Miscellaneous', 12),

    ('payment_mode', 'Cash', 1), ('payment_mode', 'UPI', 2), ('payment_mode', 'Card', 3),
    ('payment_mode', 'Bank Transfer', 4), ('payment_mode', 'Cheque', 5),

    ('expense_status', 'Pending', 1), ('expense_status', 'Paid', 2), ('expense_status', 'Cancelled', 3),

    ('invitation_status', 'Yes', 1), ('invitation_status', 'No', 2),

    ('shopping_category', 'Groom Outfits', 1), ('shopping_category', 'Bride Outfits', 2),
    ('shopping_category', 'Family Outfits', 3), ('shopping_category', 'Jewellery', 4),
    ('shopping_category', 'Return Gifts', 5), ('shopping_category', 'Home & Setup', 6),
    ('shopping_category', 'Misc', 7),

    ('shopping_status', 'Not Started', 1), ('shopping_status', 'Ordered', 2), ('shopping_status', 'Purchased', 3),
    ('shopping_status', 'Delivered', 4), ('shopping_status', 'Alteration Pending', 5), ('shopping_status', 'Completed', 6),

    ('inventory_status', 'Not Ordered', 1), ('inventory_status', 'Ordered', 2),
    ('inventory_status', 'In Hand', 3), ('inventory_status', 'Distributed', 4),

    ('task_category', 'Venue', 1), ('task_category', 'Catering', 2), ('task_category', 'Decor', 3),
    ('task_category', 'Guests', 4), ('task_category', 'Shopping', 5), ('task_category', 'Documentation', 6),
    ('task_category', 'Other', 7),

    ('task_priority', 'High', 1), ('task_priority', 'Medium', 2), ('task_priority', 'Low', 3),

    ('task_status', 'Not Started', 1), ('task_status', 'In Progress', 2), ('task_status', 'Completed', 3),

    ('timeline_event', 'Engagement', 1), ('timeline_event', 'Haldi', 2), ('timeline_event', 'Mehendi', 3),
    ('timeline_event', 'Sangeet', 4), ('timeline_event', 'Wedding', 5), ('timeline_event', 'Reception', 6),
    ('timeline_event', 'Custom', 7),

    ('timeline_status', 'Upcoming', 1), ('timeline_status', 'In Progress', 2), ('timeline_status', 'Done', 3),

    ('contact_type', 'Family', 1), ('contact_type', 'Photographer', 2), ('contact_type', 'Decorator', 3),
    ('contact_type', 'Caterer', 4), ('contact_type', 'Hotel', 5), ('contact_type', 'Transportation', 6),
    ('contact_type', 'Emergency', 7), ('contact_type', 'Other Vendor', 8),

    ('document_category', 'Bill', 1), ('document_category', 'Contract', 2), ('document_category', 'Invitation Design', 3),
    ('document_category', 'Receipt', 4), ('document_category', 'Important Document', 5), ('document_category', 'Photo', 6),
    ('document_category', 'Video', 7),

    ('vendor_category', 'Hall', 1), ('vendor_category', 'Decoration', 2), ('vendor_category', 'Food', 3),
    ('vendor_category', 'Photography', 4), ('vendor_category', 'Invitation', 5), ('vendor_category', 'Jewellery', 6),
    ('vendor_category', 'Shopping', 7), ('vendor_category', 'Travel', 8), ('vendor_category', 'Accommodation', 9),
    ('vendor_category', 'Music', 10), ('vendor_category', 'Return Gifts', 11), ('vendor_category', 'Miscellaneous', 12)
  ) as defaults(list_type, value, sort_order);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_wedding_created_seed_lists
  after insert on public.weddings
  for each row execute function public.seed_default_list_options();
