-- =========================================================================
-- 0002_rls_policies.sql
-- Row Level Security: every wedding-scoped table is isolated per tenant.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Helper: is the current user an active member of a wedding, at or
-- above a given role? SECURITY DEFINER + STABLE so it can be reused in
-- policies without triggering RLS recursion on wedding_members itself.
-- ---------------------------------------------------------------------
create function public.is_wedding_member(p_wedding_id uuid, p_min_role public.wedding_role default 'viewer')
returns boolean as $$
  select exists (
    select 1
    from public.wedding_members wm
    where wm.wedding_id = p_wedding_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and (
        p_min_role = 'viewer'
        or (p_min_role = 'member' and wm.role in ('owner', 'member'))
        or (p_min_role = 'owner' and wm.role = 'owner')
      )
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------
alter table public.user_profiles enable row level security;

create policy "profiles: read own" on public.user_profiles
  for select using (id = auth.uid());

create policy "profiles: read co-members" on public.user_profiles
  for select using (
    exists (
      select 1 from public.wedding_members mine
      join public.wedding_members theirs
        on theirs.wedding_id = mine.wedding_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = user_profiles.id
        and theirs.status = 'active'
    )
  );

create policy "profiles: update own" on public.user_profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------
-- weddings
-- ---------------------------------------------------------------------
alter table public.weddings enable row level security;

create policy "weddings: select as member" on public.weddings
  for select using (public.is_wedding_member(id, 'viewer'));

create policy "weddings: insert as authenticated user" on public.weddings
  for insert with check (owner_id = auth.uid());

create policy "weddings: update as owner" on public.weddings
  for update using (public.is_wedding_member(id, 'owner'));

create policy "weddings: delete as owner" on public.weddings
  for delete using (public.is_wedding_member(id, 'owner'));

-- ---------------------------------------------------------------------
-- wedding_members
-- ---------------------------------------------------------------------
alter table public.wedding_members enable row level security;

create policy "members: select co-members" on public.wedding_members
  for select using (public.is_wedding_member(wedding_id, 'viewer'));

create policy "members: owner manages roles/removal" on public.wedding_members
  for update using (public.is_wedding_member(wedding_id, 'owner'));

create policy "members: owner removes members" on public.wedding_members
  for delete using (public.is_wedding_member(wedding_id, 'owner'));

-- Inserts happen only via the on_wedding_created trigger (owner) and the
-- accept_invitation() RPC below, both SECURITY DEFINER — no direct
-- client-side INSERT policy needed.

-- ---------------------------------------------------------------------
-- wedding_invitations
-- ---------------------------------------------------------------------
alter table public.wedding_invitations enable row level security;

create policy "invitations: owner manages" on public.wedding_invitations
  for all using (public.is_wedding_member(wedding_id, 'owner'))
  with check (public.is_wedding_member(wedding_id, 'owner'));

create policy "invitations: invitee can view own pending invite" on public.wedding_invitations
  for select using (
    email = (auth.jwt() ->> 'email')::citext
    and status = 'pending'
  );

-- ---------------------------------------------------------------------
-- list_options
-- ---------------------------------------------------------------------
alter table public.list_options enable row level security;

create policy "list_options: select as member" on public.list_options
  for select using (public.is_wedding_member(wedding_id, 'viewer'));

create policy "list_options: manage as member+" on public.list_options
  for insert with check (public.is_wedding_member(wedding_id, 'member'));

create policy "list_options: update as member+" on public.list_options
  for update using (public.is_wedding_member(wedding_id, 'member'));

create policy "list_options: delete as owner" on public.list_options
  for delete using (public.is_wedding_member(wedding_id, 'owner'));

-- ---------------------------------------------------------------------
-- accept_invitation(token): the only path for turning an invitation
-- into membership. Runs as SECURITY DEFINER so it can bypass the
-- wedding_members insert-policy gap, but re-validates everything itself.
-- ---------------------------------------------------------------------
create function public.accept_invitation(p_token uuid)
returns public.wedding_members as $$
declare
  v_invite public.wedding_invitations;
  v_member public.wedding_members;
begin
  select * into v_invite
  from public.wedding_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Invitation not found.';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation is no longer valid (status: %).', v_invite.status;
  end if;

  if v_invite.expires_at < now() then
    update public.wedding_invitations set status = 'expired' where id = v_invite.id;
    raise exception 'Invitation has expired.';
  end if;

  if v_invite.email <> (auth.jwt() ->> 'email')::citext then
    raise exception 'This invitation was sent to a different email address.';
  end if;

  insert into public.wedding_members (wedding_id, user_id, role, status)
  values (v_invite.wedding_id, auth.uid(), v_invite.role, 'active')
  on conflict (wedding_id, user_id)
  do update set role = excluded.role, status = 'active'
  returning * into v_member;

  update public.wedding_invitations set status = 'accepted' where id = v_invite.id;

  return v_member;
end;
$$ language plpgsql security definer set search_path = public;
