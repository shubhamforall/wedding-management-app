import type { Request, Response } from 'express';
import * as memberService from '../services/memberService';
import { changeMemberRoleSchema, transferOwnershipSchema } from '../validators/weddingValidators';
import type { MemberWithUserRow } from '../repositories/weddingMemberRepository';

function serializeMember(m: MemberWithUserRow) {
  return {
    id: m.id,
    weddingId: m.wedding_id,
    userId: m.user_id,
    role: m.role,
    status: m.status,
    joinedAt: m.joined_at,
    fullName: m.full_name,
    avatarUrl: m.avatar_url,
    email: m.email,
  };
}

export async function list(req: Request, res: Response) {
  const members = await memberService.listMembers(req.params.weddingId!);
  res.json({ success: true, members: members.map(serializeMember) });
}

export async function changeRole(req: Request, res: Response) {
  const input = changeMemberRoleSchema.parse(req.body);
  await memberService.changeMemberRole(req.params.weddingId!, req.params.memberId!, input.role);
  res.json({ success: true });
}

export async function remove(req: Request, res: Response) {
  await memberService.removeMember(req.params.weddingId!, req.params.memberId!);
  res.json({ success: true });
}

export async function transferOwnership(req: Request, res: Response) {
  const input = transferOwnershipSchema.parse(req.body);
  await memberService.transferOwnership(req.params.weddingId!, req.membership!.memberId, input.newOwnerMemberId);
  res.json({ success: true });
}
