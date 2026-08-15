import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';
import { AppError } from '../utils/AppError';

export type WeddingRole = 'owner' | 'member' | 'viewer';
const ROLE_RANK: Record<WeddingRole, number> = { viewer: 0, member: 1, owner: 2 };

export function roleAtLeast(role: WeddingRole, min: WeddingRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export interface MemberRow extends RowDataPacket {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  status: 'active' | 'removed';
  joined_at: string;
  created_at: string;
}

export interface MemberWithUserRow extends MemberRow {
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

export async function findActiveMembership(weddingId: string, userId: string): Promise<MemberRow | null> {
  const [rows] = await pool.query<MemberRow[]>(
    `SELECT * FROM wedding_members WHERE wedding_id = ? AND user_id = ? AND status = 'active' LIMIT 1`,
    [weddingId, userId]
  );
  return rows[0] ?? null;
}

export async function findMembersForWedding(weddingId: string): Promise<MemberWithUserRow[]> {
  const [rows] = await pool.query<MemberWithUserRow[]>(
    `SELECT wm.*, u.full_name, u.avatar_url, u.email
     FROM wedding_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.wedding_id = ? AND wm.status = 'active'
     ORDER BY wm.joined_at ASC`,
    [weddingId]
  );
  return rows;
}

export async function findMemberById(memberId: string): Promise<MemberRow | null> {
  const [rows] = await pool.query<MemberRow[]>('SELECT * FROM wedding_members WHERE id = ? LIMIT 1', [
    memberId,
  ]);
  return rows[0] ?? null;
}

// Runs on the caller's transaction connection — see weddingService.createWedding.
export async function insertOwnerMembership(
  conn: PoolConnection,
  weddingId: string,
  userId: string
): Promise<void> {
  await conn.query(
    `INSERT INTO wedding_members (id, wedding_id, user_id, role, status) VALUES (?, ?, ?, 'owner', 'active')`,
    [newId(), weddingId, userId]
  );
}

export async function insertMembership(
  weddingId: string,
  userId: string,
  role: WeddingRole
): Promise<MemberRow> {
  const id = newId();
  await pool.query(
    `INSERT INTO wedding_members (id, wedding_id, user_id, role, status)
     VALUES (?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE role = VALUES(role), status = 'active'`,
    [id, weddingId, userId, role]
  );
  // ON DUPLICATE KEY doesn't tell us the existing id, so re-read by the
  // natural key rather than trusting the id we generated.
  const membership = await findActiveMembership(weddingId, userId);
  if (!membership) throw new Error('Membership insert/upsert returned no row.');
  return membership;
}

async function countOtherActiveOwners(
  conn: PoolConnection,
  weddingId: string,
  excludingMemberId: string
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM wedding_members
     WHERE wedding_id = ? AND role = 'owner' AND status = 'active' AND id != ?`,
    [weddingId, excludingMemberId]
  );
  return Number(rows[0]?.cnt ?? 0);
}

// Replaces the old guard_last_owner Postgres trigger — must run inside the
// same transaction as the mutation it's guarding, so the count is accurate
// even under concurrent requests.
export async function assertNotLastOwner(
  conn: PoolConnection,
  member: MemberRow,
  nextRole: WeddingRole | null,
  nextStatus: 'active' | 'removed' | null
): Promise<void> {
  const losingOwnerStatus = member.role === 'owner' && (nextRole !== 'owner' || nextStatus !== 'active');
  if (!losingOwnerStatus) return;

  const remaining = await countOtherActiveOwners(conn, member.wedding_id, member.id);
  if (remaining === 0) {
    throw AppError.conflict('Cannot remove the last owner of a wedding. Transfer ownership first.');
  }
}

export async function updateMemberRole(conn: PoolConnection, memberId: string, role: WeddingRole): Promise<void> {
  await conn.query(`UPDATE wedding_members SET role = ? WHERE id = ?`, [role, memberId]);
}

export async function deleteMember(conn: PoolConnection, memberId: string): Promise<void> {
  await conn.query('DELETE FROM wedding_members WHERE id = ?', [memberId]);
}
