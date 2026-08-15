import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

export interface WeddingRow extends RowDataPacket {
  id: string;
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  reception_date: string | null;
  venue: string | null;
  address: string | null;
  wedding_side: 'groom' | 'bride' | 'both';
  owner_id: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingWithRoleRow extends WeddingRow {
  role: 'owner' | 'member' | 'viewer';
}

export async function findWeddingsForUser(userId: string): Promise<WeddingWithRoleRow[]> {
  const [rows] = await pool.query<WeddingWithRoleRow[]>(
    `SELECT w.*, wm.role AS role
     FROM wedding_members wm
     JOIN weddings w ON w.id = wm.wedding_id
     WHERE wm.user_id = ? AND wm.status = 'active'
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function findWeddingById(weddingId: string): Promise<WeddingRow | null> {
  const [rows] = await pool.query<WeddingRow[]>('SELECT * FROM weddings WHERE id = ? LIMIT 1', [weddingId]);
  return rows[0] ?? null;
}

export interface CreateWeddingInput {
  name: string;
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  receptionDate: string | null;
  venue: string | null;
  address: string | null;
  weddingSide: 'groom' | 'bride' | 'both';
  ownerId: string;
}

// Runs on a caller-supplied transaction connection — wedding creation must
// atomically create the row, the owner's membership, and every seeded
// default (list options, budget categories, timeline events, announcement
// placeholder), same all-or-nothing guarantee the old Postgres triggers gave
// for free. See weddingService.createWedding for the transaction wrapper.
export async function insertWedding(conn: PoolConnection, input: CreateWeddingInput): Promise<string> {
  const id = newId();
  await conn.query(
    `INSERT INTO weddings
       (id, name, bride_name, groom_name, wedding_date, reception_date, venue, address, wedding_side, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.brideName,
      input.groomName,
      input.weddingDate,
      input.receptionDate,
      input.venue,
      input.address,
      input.weddingSide,
      input.ownerId,
    ]
  );
  return id;
}

export interface UpdateWeddingInput {
  name?: string;
  brideName?: string;
  groomName?: string;
  weddingDate?: string | null;
  receptionDate?: string | null;
  venue?: string | null;
  address?: string | null;
  weddingSide?: 'groom' | 'bride' | 'both';
}

const UPDATABLE_COLUMNS: Record<keyof UpdateWeddingInput, string> = {
  name: 'name',
  brideName: 'bride_name',
  groomName: 'groom_name',
  weddingDate: 'wedding_date',
  receptionDate: 'reception_date',
  venue: 'venue',
  address: 'address',
  weddingSide: 'wedding_side',
};

export async function updateWedding(weddingId: string, input: UpdateWeddingInput): Promise<void> {
  const entries = Object.entries(input).filter(([, v]) => v !== undefined) as [
    keyof UpdateWeddingInput,
    unknown,
  ][];
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  await pool.query(`UPDATE weddings SET ${setClause} WHERE id = ?`, [...values, weddingId]);
}

export async function deleteWedding(weddingId: string): Promise<void> {
  await pool.query('DELETE FROM weddings WHERE id = ?', [weddingId]);
}
