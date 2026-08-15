import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

// Twelve of the app's modules (guests, vendors, expenses, shopping, etc.)
// are identical in shape: a wedding-scoped table, plain CRUD, no business
// logic beyond tenant isolation. Rather than hand-write the same
// repository/service pattern twelve times, this factory takes a column
// whitelist (fixed in code, never user input, so no injection risk) and
// produces the four operations. Modules with real logic (budget_lines,
// documents, list_options, notifications) are NOT built on this — they
// have their own repository/service files.
export function createCrudRepository<TInput extends Record<string, unknown>>(config: {
  table: string;
  columns: string[]; // camelCase keys == snake_case columns after this maps them
  orderBy: string; // raw SQL fragment, e.g. "due_date IS NULL, due_date ASC"
}) {
  const cols = config.columns;

  async function findAll(weddingId: string): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`${config.table}\` WHERE wedding_id = ? ORDER BY ${config.orderBy}`,
      [weddingId]
    );
    return rows;
  }

  async function findById(id: string): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${config.table}\` WHERE id = ? LIMIT 1`, [
      id,
    ]);
    return rows[0] ?? null;
  }

  async function create(weddingId: string, input: TInput): Promise<RowDataPacket> {
    const id = newId();
    const presentCols = cols.filter((c) => input[c] !== undefined);
    const placeholders = presentCols.map(() => '?').join(', ');
    const columnNames = ['id', 'wedding_id', ...presentCols].map((c) => `\`${c}\``).join(', ');
    const values = [id, weddingId, ...presentCols.map((c) => input[c])];

    await pool.query(
      `INSERT INTO \`${config.table}\` (${columnNames}) VALUES (?, ?${placeholders ? ', ' + placeholders : ''})`,
      values
    );
    const row = await findById(id);
    if (!row) throw new Error(`${config.table} creation returned no row.`);
    return row;
  }

  async function update(id: string, input: Partial<TInput>): Promise<RowDataPacket> {
    const presentCols = cols.filter((c) => input[c] !== undefined);
    if (presentCols.length > 0) {
      const setClause = presentCols.map((c) => `\`${c}\` = ?`).join(', ');
      const values = presentCols.map((c) => input[c]);
      await pool.query(`UPDATE \`${config.table}\` SET ${setClause} WHERE id = ?`, [...values, id]);
    }
    const row = await findById(id);
    if (!row) throw new Error(`${config.table} row not found after update.`);
    return row;
  }

  async function remove(id: string): Promise<void> {
    await pool.query(`DELETE FROM \`${config.table}\` WHERE id = ?`, [id]);
  }

  async function belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM \`${config.table}\` WHERE id = ? AND wedding_id = ? LIMIT 1`,
      [id, weddingId]
    );
    return rows.length > 0;
  }

  return { findAll, findById, create, update, remove, belongsToWedding };
}
