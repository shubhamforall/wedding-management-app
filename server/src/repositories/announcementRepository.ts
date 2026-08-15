import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

export interface AnnouncementRow extends RowDataPacket {
  wedding_id: string;
  message: string | null;
  updated_by: string | null;
  updated_at: string;
}

export async function findAnnouncement(weddingId: string): Promise<AnnouncementRow | null> {
  const [rows] = await pool.query<AnnouncementRow[]>(
    'SELECT * FROM wedding_announcements WHERE wedding_id = ? LIMIT 1',
    [weddingId]
  );
  return rows[0] ?? null;
}

export async function updateAnnouncement(weddingId: string, message: string, updatedBy: string): Promise<void> {
  await pool.query('UPDATE wedding_announcements SET message = ?, updated_by = ? WHERE wedding_id = ?', [
    message,
    updatedBy,
    weddingId,
  ]);
}
