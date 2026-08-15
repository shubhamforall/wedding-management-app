import { pool } from '../config/db';
import { newId } from '../utils/uuid';
import { AppError } from '../utils/AppError';
import {
  deleteWedding as deleteWeddingRow,
  findWeddingById,
  findWeddingsForUser,
  insertWedding,
  updateWedding as updateWeddingRow,
  type CreateWeddingInput,
  type UpdateWeddingInput,
} from '../repositories/weddingRepository';
import { insertOwnerMembership } from '../repositories/weddingMemberRepository';
import { DEFAULT_BUDGET_CATEGORIES, DEFAULT_LIST_OPTIONS, DEFAULT_TIMELINE_EVENTS } from '../repositories/seedDefaults';

export async function listMyWeddings(userId: string) {
  return findWeddingsForUser(userId);
}

// All-or-nothing, replacing what four separate Postgres AFTER INSERT
// triggers used to guarantee for free (owner membership, list_options,
// budget_lines, timeline_events, wedding_announcements — see
// MIGRATION_ANALYSIS.md Section I on why none of this had app code before).
export async function createWedding(input: CreateWeddingInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const weddingId = await insertWedding(conn, input);
    await insertOwnerMembership(conn, weddingId, input.ownerId);

    await conn.query('INSERT INTO wedding_announcements (wedding_id) VALUES (?)', [weddingId]);

    for (const category of DEFAULT_BUDGET_CATEGORIES) {
      await conn.query('INSERT INTO budget_lines (id, wedding_id, category) VALUES (?, ?, ?)', [
        newId(),
        weddingId,
        category,
      ]);
    }

    for (const eventName of DEFAULT_TIMELINE_EVENTS) {
      await conn.query(
        `INSERT INTO timeline_events (id, wedding_id, event_name, status) VALUES (?, ?, ?, 'Upcoming')`,
        [newId(), weddingId, eventName]
      );
    }

    for (const option of DEFAULT_LIST_OPTIONS) {
      await conn.query(
        'INSERT INTO list_options (id, wedding_id, list_type, value, sort_order) VALUES (?, ?, ?, ?, ?)',
        [newId(), weddingId, option.listType, option.value, option.sortOrder]
      );
    }

    await conn.commit();

    const wedding = await findWeddingById(weddingId);
    if (!wedding) throw new Error('Wedding creation returned no row.');
    return wedding;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getWedding(weddingId: string) {
  const wedding = await findWeddingById(weddingId);
  if (!wedding) throw AppError.notFound('Wedding not found.');
  return wedding;
}

export async function updateWedding(weddingId: string, input: UpdateWeddingInput) {
  await updateWeddingRow(weddingId, input);
  return getWedding(weddingId);
}

export async function deleteWedding(weddingId: string) {
  await deleteWeddingRow(weddingId);
}
