-- =========================================================================
-- 0010_notifications.sql
-- In-app notification center: membership/role events. Email delivery is
-- explicitly future scope per the product brief — this is the in-app half.
-- =========================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  type text not null check (type in ('success', 'warning', 'error', 'info')),
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: select own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications: update own (mark read)" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications: delete own" on public.notifications
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Notify a wedding's active owners when someone joins via invitation.
-- Called from accept_invitation() (SECURITY DEFINER, so this insert
-- bypasses the "select own" policy correctly as the row owner differs
-- from the actor).
-- ---------------------------------------------------------------------
create function public.notify_wedding_owners_new_member()
returns trigger as $$
declare
  v_joiner_name text;
  v_wedding_name text;
begin
  select full_name into v_joiner_name from public.user_profiles where id = new.user_id;
  select name into v_wedding_name from public.weddings where id = new.wedding_id;

  insert into public.notifications (user_id, wedding_id, type, title, message, link)
  select
    wm.user_id,
    new.wedding_id,
    'info',
    coalesce(v_joiner_name, 'Someone') || ' joined ' || coalesce(v_wedding_name, 'your wedding'),
    'Role: ' || new.role,
    '/w/' || new.wedding_id || '/members'
  from public.wedding_members wm
  where wm.wedding_id = new.wedding_id
    and wm.role = 'owner'
    and wm.status = 'active'
    and wm.user_id <> new.user_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_member_joined_notify_owners
  after insert on public.wedding_members
  for each row execute function public.notify_wedding_owners_new_member();

-- ---------------------------------------------------------------------
-- Notify a member when their role changes, or when they're removed.
-- ---------------------------------------------------------------------
create function public.notify_member_role_change()
returns trigger as $$
declare
  v_wedding_name text;
begin
  select name into v_wedding_name from public.weddings where id = old.wedding_id;

  if tg_op = 'UPDATE' and new.role <> old.role then
    insert into public.notifications (user_id, wedding_id, type, title, message, link)
    values (
      new.user_id, new.wedding_id, 'info',
      'Your role changed in ' || coalesce(v_wedding_name, 'a wedding'),
      'You are now a ' || new.role,
      '/w/' || new.wedding_id
    );
  elsif tg_op = 'DELETE' then
    insert into public.notifications (user_id, wedding_id, type, title, message)
    values (
      old.user_id, old.wedding_id, 'warning',
      'You were removed from ' || coalesce(v_wedding_name, 'a wedding'),
      null
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_member_role_change_notify
  after update or delete on public.wedding_members
  for each row execute function public.notify_member_role_change();
