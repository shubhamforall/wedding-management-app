import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

export interface ListOptionRow extends RowDataPacket {
  id: string;
  wedding_id: string;
  list_type: string;
  value: string;
  sort_order: number;
  is_active: number;
}

export async function findListOptions(weddingId: string, listType: string): Promise<ListOptionRow[]> {
  const [rows] = await pool.query<ListOptionRow[]>(
    `SELECT * FROM list_options WHERE wedding_id = ? AND list_type = ? AND is_active = 1 ORDER BY sort_order ASC`,
    [weddingId, listType]
  );
  return rows;
}

export async function findListOptionById(id: string): Promise<ListOptionRow | null> {
  const [rows] = await pool.query<ListOptionRow[]>('SELECT * FROM list_options WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function createListOption(
  weddingId: string,
  listType: string,
  value: string,
  sortOrder: number
): Promise<ListOptionRow> {
  const id = newId();
  await pool.query(
    'INSERT INTO list_options (id, wedding_id, list_type, value, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, weddingId, listType, value, sortOrder]
  );
  const row = await findListOptionById(id);
  if (!row) throw new Error('list_options creation returned no row.');
  return row;
}

export async function updateListOptionValue(id: string, value: string): Promise<void> {
  await pool.query('UPDATE list_options SET value = ? WHERE id = ?', [value, id]);
}

export async function updateListOptionOrder(id: string, sortOrder: number): Promise<void> {
  await pool.query('UPDATE list_options SET sort_order = ? WHERE id = ?', [sortOrder, id]);
}

export async function deleteListOption(id: string): Promise<void> {
  // Matches the original design: never hard-delete a list option that
  // existing rows elsewhere might reference by value — soft-delete via
  // is_active, same as the Postgres schema's `is_active` column implies.
  await pool.query('UPDATE list_options SET is_active = 0 WHERE id = ?', [id]);
}
