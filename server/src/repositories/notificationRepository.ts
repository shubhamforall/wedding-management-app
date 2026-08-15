import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface NotificationRow extends RowDataPacket {
  id: string;
  user_id: string;
  wedding_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

export async function findNotificationsForUser(userId: string): Promise<NotificationRow[]> {
  const [rows] = await pool.query<NotificationRow[]>(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return rows;
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
}

interface CreateNotificationInput {
  userId: string;
  weddingId: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
}

// Accepts an optional transaction connection so callers that need this
// inside a larger atomic operation (e.g. member removal + notification)
// can pass one; falls back to the pool for standalone use.
export async function insertNotification(
  input: CreateNotificationInput,
  conn: PoolConnection | typeof pool = pool
): Promise<void> {
  await conn.query(
    `INSERT INTO notifications (id, user_id, wedding_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newId(), input.userId, input.weddingId, input.type, input.title, input.message ?? null, input.link ?? null]
  );
}

export async function insertNotificationsForOwners(
  conn: PoolConnection,
  weddingId: string,
  excludingUserId: string,
  title: string,
  message: string | null,
  link: string | null
): Promise<void> {
  const [owners] = await conn.query<import('mysql2').RowDataPacket[]>(
    `SELECT user_id FROM wedding_members
     WHERE wedding_id = ? AND role = 'owner' AND status = 'active' AND user_id != ?`,
    [weddingId, excludingUserId]
  );
  for (const owner of owners) {
    await insertNotification(
      { userId: owner.user_id, weddingId, type: 'info', title, message, link },
      conn
    );
  }
}
