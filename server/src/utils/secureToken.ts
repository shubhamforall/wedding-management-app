import { randomBytes, createHash } from 'node:crypto';

// Password-reset / email-verification / refresh tokens are opaque random
// values, not JWTs — the raw value goes to the user (email link, cookie),
// only its SHA-256 hash is stored, so a DB read alone can't forge a valid
// token (same reasoning as never storing plaintext passwords).
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
