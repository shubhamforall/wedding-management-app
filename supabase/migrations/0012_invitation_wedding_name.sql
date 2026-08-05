-- =========================================================================
-- 0012_invitation_wedding_name.sql
-- An invitee can SELECT their own pending wedding_invitations row (RLS:
-- "invitations: invitee can view own pending invite"), but cannot join to
-- weddings for the name — they aren't a member yet, and the weddings SELECT
-- policy requires membership/ownership. Denormalize the name onto the
-- invitation row at creation time instead of fighting that RLS boundary,
-- so the landing page can show "You're invited to X" before acceptance.
-- =========================================================================

alter table public.wedding_invitations add column wedding_name text;

-- Backfill existing pending invitations so old rows aren't blank.
update public.wedding_invitations wi
set wedding_name = w.name
from public.weddings w
where w.id = wi.wedding_id and wi.wedding_name is null;
