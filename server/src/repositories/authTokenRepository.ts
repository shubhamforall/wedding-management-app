import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { newId } from '../utils/uuid';

interface TokenRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string | null;
  revoked_at?: string | null;
}

// --- password reset ---

export async function createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  const id = newId();
  await pool.query(
    'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, tokenHash, expiresAt]
  );
}

export async function findValidPasswordResetToken(tokenHash: string): Promise<TokenRow | null> {
  const [rows] = await pool.query<TokenRow[]>(
    'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(id: string) {
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id]);
}

// --- email verification ---

export async function createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
  const id = newId();
  await pool.query(
    'INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, tokenHash, expiresAt]
  );
}

export async function findValidEmailVerificationToken(tokenHash: string): Promise<TokenRow | null> {
  const [rows] = await pool.query<TokenRow[]>(
    'SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function deleteEmailVerificationToken(id: string) {
  await pool.query('DELETE FROM email_verification_tokens WHERE id = ?', [id]);
}

// --- refresh tokens ---

export async function createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
  const id = newId();
  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, tokenHash, expiresAt]
  );
}

export async function findValidRefreshToken(tokenHash: string): Promise<TokenRow | null> {
  const [rows] = await pool.query<TokenRow[]>(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function revokeRefreshToken(id: string) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [id]);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [
    userId,
  ]);
}
