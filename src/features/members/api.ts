import { supabase } from '@/lib/supabase';
import type { WeddingMember, WeddingRole } from '@/types/database';
import type { InvitationRow, MemberRow } from './types';

export async function fetchMembers(weddingId: string): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from('wedding_members')
    .select('id, wedding_id, user_id, role, status, joined_at, user_profiles(*)')
    .eq('wedding_id', weddingId)
    .eq('status', 'active')
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })
    .returns<MemberRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchPendingInvitations(weddingId: string): Promise<InvitationRow[]> {
  const { data, error } = await supabase
    .from('wedding_invitations')
    .select('id, wedding_id, email, role, status, token, expires_at, created_at')
    .eq('wedding_id', weddingId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .returns<InvitationRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function inviteMember(weddingId: string, email: string, role: WeddingRole) {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userRes.user) throw new Error('Not signed in.');

  const { data, error } = await supabase
    .from('wedding_invitations')
    .insert({ wedding_id: weddingId, email: email.trim().toLowerCase(), role, invited_by: userRes.user.id })
    .select('id, wedding_id, email, role, status, token, expires_at, created_at')
    .single()
    .returns<InvitationRow>();

  if (error) throw error;

  // Best-effort: send the invite email via Edge Function. Failing to send
  // shouldn't block the invite from existing — the owner can still share
  // the link manually (surfaced in the UI) or hit "Resend".
  try {
    await supabase.functions.invoke('send-invitation-email', { body: { invitationId: data.id } });
  } catch {
    // swallow — invitation row is the source of truth, email is a convenience
  }

  return data;
}

export async function resendInvitation(invitationId: string) {
  const { data, error } = await supabase
    .from('wedding_invitations')
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', invitationId)
    .select('id, wedding_id, email, role, status, token, expires_at, created_at')
    .single()
    .returns<InvitationRow>();

  if (error) throw error;

  try {
    await supabase.functions.invoke('send-invitation-email', { body: { invitationId } });
  } catch {
    // swallow, see inviteMember
  }

  return data;
}

export async function revokeInvitation(invitationId: string) {
  const { error } = await supabase.from('wedding_invitations').update({ status: 'revoked' }).eq('id', invitationId);
  if (error) throw error;
}

export async function changeMemberRole(memberId: string, role: WeddingRole) {
  const { error } = await supabase.from('wedding_members').update({ role }).eq('id', memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string) {
  const { error } = await supabase.from('wedding_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function transferOwnership(currentOwnerMemberId: string, newOwnerMemberId: string) {
  // Order matters: promote the new owner first so the wedding always has
  // at least one owner — the DB's guard_last_owner trigger would otherwise
  // reject demoting the current owner while nobody else holds the role yet.
  const { error: promoteError } = await supabase
    .from('wedding_members')
    .update({ role: 'owner' })
    .eq('id', newOwnerMemberId);
  if (promoteError) throw promoteError;

  const { error: demoteError } = await supabase
    .from('wedding_members')
    .update({ role: 'member' })
    .eq('id', currentOwnerMemberId);
  if (demoteError) throw demoteError;
}

export async function acceptInvitation(token: string): Promise<WeddingMember> {
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  if (!data) throw new Error('Accepting invitation returned no data.');
  return data as WeddingMember;
}
