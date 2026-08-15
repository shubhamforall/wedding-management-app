import type { Request, Response } from 'express';
import * as invitationService from '../services/invitationService';
import { createInvitationSchema } from '../validators/invitationValidators';
import * as authService from '../services/authService';
import type { InvitationRow } from '../repositories/invitationRepository';

function serialize(inv: InvitationRow) {
  return {
    id: inv.id,
    weddingId: inv.wedding_id,
    weddingName: inv.wedding_name,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    status: inv.status,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
  };
}

export async function listForWedding(req: Request, res: Response) {
  const invitations = await invitationService.listPendingForWedding(req.params.weddingId!);
  res.json({ success: true, invitations: invitations.map(serialize) });
}

export async function listMine(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  const invitations = await invitationService.listMyPendingInvitations(user.email);
  res.json({ success: true, invitations: invitations.map(serialize) });
}

export async function create(req: Request, res: Response) {
  const input = createInvitationSchema.parse(req.body);
  const { invitation, emailSent } = await invitationService.inviteMember(
    req.params.weddingId!,
    req.user!.id,
    input.email,
    input.role
  );
  res.status(201).json({
    success: true,
    invitation: serialize(invitation),
    emailSent,
    message: emailSent ? undefined : 'Invitation created, but the email could not be sent. Share the invite link directly.',
  });
}

export async function resend(req: Request, res: Response) {
  const { emailSent } = await invitationService.resendInvitation(req.params.weddingId!, req.params.invitationId!);
  res.json({
    success: true,
    emailSent,
    message: emailSent ? undefined : 'Could not resend the email. Share the invite link directly.',
  });
}

export async function revoke(req: Request, res: Response) {
  await invitationService.revokeInvitation(req.params.weddingId!, req.params.invitationId!);
  res.json({ success: true });
}

export async function accept(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  const membership = await invitationService.acceptInvitation(req.params.token!, req.user!.id, user.email);
  res.json({ success: true, membership: { weddingId: membership.wedding_id, role: membership.role } });
}
