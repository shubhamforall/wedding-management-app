import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';
import type { WeddingRole } from './weddingMemberRepository';

export interface InvitationRow extends RowDataPacket {
  id: string;
  wedding_id: string;
  wedding_name: string | null;
  email: string;
  role: WeddingRole;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invited_by: string;
  expires_at: string;
  created_at: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function findPendingInvitation(weddingId: string, email: string): Promise<InvitationRow | null> {
  const [rows] = await pool.query<InvitationRow[]>(
    `SELECT * FROM wedding_invitations WHERE wedding_id = ? AND email = ? AND status = 'pending' LIMIT 1`,
    [weddingId, email.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function findInvitationById(id: string): Promise<InvitationRow | null> {
  const [rows] = await pool.query<InvitationRow[]>('SELECT * FROM wedding_invitations WHERE id = ? LIMIT 1', [
    id,
  ]);
  return rows[0] ?? null;
}

export async function findInvitationByToken(token: string): Promise<InvitationRow | null> {
  const [rows] = await pool.query<InvitationRow[]>(
    'SELECT * FROM wedding_invitations WHERE token = ? LIMIT 1',
    [token]
  );
  return rows[0] ?? null;
}

export async function findPendingInvitationsForWedding(weddingId: string): Promise<InvitationRow[]> {
  const [rows] = await pool.query<InvitationRow[]>(
    `SELECT * FROM wedding_invitations WHERE wedding_id = ? AND status = 'pending' ORDER BY created_at DESC`,
    [weddingId]
  );
  return rows;
}

export async function findPendingInvitationsForEmail(email: string): Promise<InvitationRow[]> {
  const [rows] = await pool.query<InvitationRow[]>(
    `SELECT * FROM wedding_invitations WHERE email = ? AND status = 'pending' ORDER BY created_at DESC`,
    [email.toLowerCase()]
  );
  return rows;
}

export interface CreateInvitationInput {
  weddingId: string;
  weddingName: string;
  email: string;
  role: WeddingRole;
  invitedBy: string;
}

export async function createInvitation(input: CreateInvitationInput): Promise<InvitationRow> {
  const id = newId();
  const token = newId();
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
  await pool.query(
    `INSERT INTO wedding_invitations (id, wedding_id, wedding_name, email, role, token, invited_by, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.weddingId, input.weddingName, input.email.toLowerCase(), input.role, token, input.invitedBy, expiresAt]
  );
  const invitation = await findInvitationById(id);
  if (!invitation) throw new Error('Invitation creation returned no row.');
  return invitation;
}

export async function extendInvitationExpiry(id: string): Promise<void> {
  await pool.query('UPDATE wedding_invitations SET expires_at = ? WHERE id = ?', [
    new Date(Date.now() + SEVEN_DAYS_MS),
    id,
  ]);
}

export async function setInvitationStatus(
  id: string,
  status: InvitationRow['status']
): Promise<void> {
  await pool.query('UPDATE wedding_invitations SET status = ? WHERE id = ?', [status, id]);
}
