import { api } from '@/lib/api';
import { toSnakeCaseObject } from '@/lib/caseMapping';
import type { WeddingMember, WeddingRole } from '@/types/database';
import type { InvitationRow, MemberRow } from './types';

interface ApiMember {
  id: string;
  weddingId: string;
  userId: string;
  role: WeddingRole;
  status: string;
  joinedAt: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
}

function toMemberRow(m: ApiMember): MemberRow {
  return {
    id: m.id,
    wedding_id: m.weddingId,
    user_id: m.userId,
    role: m.role,
    status: m.status as MemberRow['status'],
    joined_at: m.joinedAt,
    user_profiles: { id: m.userId, full_name: m.fullName, avatar_url: m.avatarUrl, phone: null, created_at: '' },
  };
}

export async function fetchMembers(weddingId: string): Promise<MemberRow[]> {
  const { members } = await api.get<{ members: ApiMember[] }>(`/weddings/${weddingId}/members`);
  return members.map(toMemberRow);
}

export async function fetchPendingInvitations(weddingId: string): Promise<InvitationRow[]> {
  const { invitations } = await api.get<{ invitations: Record<string, unknown>[] }>(
    `/weddings/${weddingId}/invitations`
  );
  return invitations.map((i) => toSnakeCaseObject<InvitationRow>(i));
}

export async function inviteMember(weddingId: string, _weddingName: string, email: string, role: WeddingRole) {
  const { invitation, emailSent } = await api.post<{ invitation: Record<string, unknown>; emailSent: boolean }>(
    `/weddings/${weddingId}/invitations`,
    { email: email.trim().toLowerCase(), role }
  );
  return { invitation: toSnakeCaseObject<InvitationRow>(invitation), emailSent };
}

export async function resendInvitation(weddingId: string, invitationId: string) {
  const { emailSent } = await api.post<{ emailSent: boolean }>(
    `/weddings/${weddingId}/invitations/${invitationId}/resend`
  );
  return { emailSent };
}

export async function revokeInvitation(weddingId: string, invitationId: string) {
  await api.delete(`/weddings/${weddingId}/invitations/${invitationId}`);
}

export async function changeMemberRole(weddingId: string, memberId: string, role: WeddingRole) {
  await api.patch(`/weddings/${weddingId}/members/${memberId}`, { role });
}

export async function removeMember(weddingId: string, memberId: string) {
  await api.delete(`/weddings/${weddingId}/members/${memberId}`);
}

export async function transferOwnership(weddingId: string, newOwnerMemberId: string) {
  await api.post(`/weddings/${weddingId}/members/transfer-ownership`, { newOwnerMemberId });
}

export async function acceptInvitation(token: string): Promise<WeddingMember> {
  const { membership } = await api.post<{ membership: { weddingId: string; role: WeddingRole } }>(
    `/invitations/${token}/accept`
  );
  // accept_invitation's caller (AcceptInvitePage) only reads wedding_id off
  // this — the rest of WeddingMember isn't available from this endpoint's
  // response and isn't needed by that caller.
  return { wedding_id: membership.weddingId, role: membership.role } as WeddingMember;
}
