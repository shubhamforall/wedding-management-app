-- =========================================================================
-- 0011_fix_weddings_select_policy.sql
-- Bug fix (found during first real end-to-end test): the weddings SELECT
-- policy only checked is_wedding_member(id, 'viewer'), which depends on
-- the wedding_members owner row an AFTER INSERT trigger creates. Postgres
-- evaluates the SELECT policy for an INSERT...RETURNING clause before that
-- trigger's effects are visible to it, so `.insert(...).select().single()`
-- (return=representation) failed with "new row violates row-level security
-- policy" even though the INSERT itself was perfectly valid — confirmed by
-- testing return=minimal (no RETURNING), which succeeded (201).
--
-- Fix: let the creator see their own row unconditionally via owner_id,
-- independent of the membership trigger's timing.
-- =========================================================================

drop policy "weddings: select as member" on public.weddings;

create policy "weddings: select as member" on public.weddings
  for select using (
    owner_id = auth.uid()
    or public.is_wedding_member(id, 'viewer')
  );
