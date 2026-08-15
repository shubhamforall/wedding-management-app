import { pool } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import {
  createInvitation,
  extendInvitationExpiry,
  findInvitationById,
  findInvitationByToken,
  findPendingInvitation,
  findPendingInvitationsForEmail,
  findPendingInvitationsForWedding,
  setInvitationStatus,
} from '../repositories/invitationRepository';
import { findWeddingById } from '../repositories/weddingRepository';
import { findUserByEmail, findUserById } from '../repositories/userRepository';
import { insertMembership, type WeddingRole } from '../repositories/weddingMemberRepository';
import { insertNotificationsForOwners } from '../repositories/notificationRepository';
import { sendInvitationEmail } from './email/email.service';

export async function listPendingForWedding(weddingId: string) {
  return findPendingInvitationsForWedding(weddingId);
}

export async function listMyPendingInvitations(email: string) {
  return findPendingInvitationsForEmail(email);
}

// Invitation creation always succeeds even if this fails — the invitation
// row (created before this ever runs, see inviteMember below) is the
// source of truth, not the email. But unlike the old Resend integration,
// the outcome is surfaced back to the caller instead of swallowed, so the
// owner can be told to share the link manually if delivery failed.
async function deliverInvitationEmail(invitationId: string): Promise<boolean> {
  const invitation = await findInvitationById(invitationId);
  if (!invitation) return false;

  const [wedding, inviter, recipient] = await Promise.all([
    findWeddingById(invitation.wedding_id),
    findUserById(invitation.invited_by),
    findUserByEmail(invitation.email),
  ]);

  const result = await sendInvitationEmail({
    to: invitation.email,
    weddingName: wedding?.name ?? invitation.wedding_name ?? 'a wedding',
    brideName: wedding?.bride_name ?? null,
    groomName: wedding?.groom_name ?? null,
    inviterName: inviter?.full_name ?? null,
    recipientName: recipient?.full_name ?? null,
    role: invitation.role,
    invitationUrl: `${env.appUrl}/invite/${invitation.token}`,
    expiresAt: new Date(invitation.expires_at),
  });
  return result.sent;
}

export async function inviteMember(
  weddingId: string,
  invitedBy: string,
  email: string,
  role: WeddingRole
) {
  const existing = await findPendingInvitation(weddingId, email);
  if (existing) throw AppError.conflict('An invitation is already pending for this email.');

  const wedding = await findWeddingById(weddingId);
  if (!wedding) throw AppError.notFound('Wedding not found.');

  const invitation = await createInvitation({ weddingId, weddingName: wedding.name, email, role, invitedBy });
  const emailSent = await deliverInvitationEmail(invitation.id);
  return { invitation, emailSent };
}

export async function resendInvitation(weddingId: string, invitationId: string) {
  const invitation = await findInvitationById(invitationId);
  if (!invitation || invitation.wedding_id !== weddingId) throw AppError.notFound('Invitation not found.');

  await extendInvitationExpiry(invitationId);
  const emailSent = await deliverInvitationEmail(invitationId);
  return { emailSent };
}

export async function revokeInvitation(weddingId: string, invitationId: string) {
  const invitation = await findInvitationById(invitationId);
  if (!invitation || invitation.wedding_id !== weddingId) throw AppError.notFound('Invitation not found.');

  await setInvitationStatus(invitationId, 'revoked');
}

// Replaces accept_invitation() SECURITY DEFINER RPC — re-validates
// everything itself rather than trusting the frontend, same as the
// Postgres function did.
export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<import('mysql2').RowDataPacket[]>(
      'SELECT * FROM wedding_invitations WHERE token = ? FOR UPDATE',
      [token]
    );
    const invitation = rows[0];
    if (!invitation) throw AppError.notFound('Invitation not found.');

    if (invitation.status !== 'pending') {
      throw AppError.badRequest(`Invitation is no longer valid (status: ${invitation.status}).`);
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      await conn.query("UPDATE wedding_invitations SET status = 'expired' WHERE id = ?", [invitation.id]);
      await conn.commit();
      throw AppError.badRequest('Invitation has expired.');
    }

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw AppError.forbidden('This invitation was sent to a different email address.');
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Membership upsert + owner notification run in their own step since
  // insertMembership/insertNotificationsForOwners use their own connection
  // handling — the validation above is what needed row-locked atomicity.
  const invitation = await findInvitationByToken(token);
  if (!invitation) throw AppError.notFound('Invitation not found.');

  const membership = await insertMembership(invitation.wedding_id, userId, invitation.role);
  await setInvitationStatus(invitation.id, 'accepted');

  const conn2 = await pool.getConnection();
  try {
    const user = await findUserByEmail(userEmail);
    const wedding = await findWeddingById(invitation.wedding_id);
    await insertNotificationsForOwners(
      conn2,
      invitation.wedding_id,
      userId,
      `${user?.full_name ?? 'Someone'} joined ${wedding?.name ?? 'your wedding'}`,
      `Role: ${invitation.role}`,
      `/w/${invitation.wedding_id}/members`
    );
  } finally {
    conn2.release();
  }

  return membership;
}
