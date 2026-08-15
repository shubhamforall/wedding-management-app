import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

export interface DocumentRow extends RowDataPacket {
  id: string;
  wedding_id: string;
  document_name: string;
  category: string | null;
  related_to: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  date_added: string;
  created_at: string;
}

export async function findDocuments(weddingId: string): Promise<DocumentRow[]> {
  const [rows] = await pool.query<DocumentRow[]>(
    'SELECT * FROM documents WHERE wedding_id = ? ORDER BY created_at DESC',
    [weddingId]
  );
  return rows;
}

export async function findDocumentById(id: string): Promise<DocumentRow | null> {
  const [rows] = await pool.query<DocumentRow[]>('SELECT * FROM documents WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function createDocument(input: {
  weddingId: string;
  documentName: string;
  category: string | null;
  relatedTo: string | null;
  storagePath: string;
  uploadedBy: string;
}): Promise<DocumentRow> {
  const id = newId();
  await pool.query(
    `INSERT INTO documents (id, wedding_id, document_name, category, related_to, storage_path, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.weddingId, input.documentName, input.category, input.relatedTo, input.storagePath, input.uploadedBy]
  );
  const row = await findDocumentById(id);
  if (!row) throw new Error('Document creation returned no row.');
  return row;
}

export async function deleteDocumentRow(id: string): Promise<void> {
  await pool.query('DELETE FROM documents WHERE id = ?', [id]);
}

export async function updateDocumentMeta(
  id: string,
  meta: { documentName?: string; category?: string | null; relatedTo?: string | null; dateAdded?: string }
): Promise<void> {
  const columnMap: Record<string, string> = {
    documentName: 'document_name',
    category: 'category',
    relatedTo: 'related_to',
    dateAdded: 'date_added',
  };
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${columnMap[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  await pool.query(`UPDATE documents SET ${setClause} WHERE id = ?`, [...values, id]);
}
