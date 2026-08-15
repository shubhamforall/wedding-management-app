import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

export interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [
    email.toLowerCase(),
  ]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string | null;
}): Promise<UserRow> {
  const id = newId();
  await pool.query(
    'INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES (?, ?, ?, ?, 0)',
    [id, input.email.toLowerCase(), input.passwordHash, input.fullName]
  );
  const user = await findUserById(id);
  if (!user) throw new Error('User creation returned no row.');
  return user;
}

// Google-created accounts have no password until/unless the user later
// sets one — password_hash stays NULL, matching the same "NULL = no
// password login path yet" convention used for pre-migration imported
// users (see MIGRATION_ANALYSIS.md Section H). email_verified is 1
// immediately since Google already verified the address.
export async function createUserFromGoogle(input: {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}): Promise<UserRow> {
  const id = newId();
  await pool.query(
    'INSERT INTO users (id, email, password_hash, full_name, avatar_url, email_verified) VALUES (?, ?, NULL, ?, ?, 1)',
    [id, input.email.toLowerCase(), input.fullName, input.avatarUrl]
  );
  const user = await findUserById(id);
  if (!user) throw new Error('User creation returned no row.');
  return user;
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

export async function markEmailVerified(userId: string): Promise<void> {
  await pool.query('UPDATE users SET email_verified = 1 WHERE id = ?', [userId]);
}
