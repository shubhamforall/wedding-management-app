import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // user id — intentionally the ONLY claim, per migration-prompt Section 10:
  // "do not put sensitive information into JWT payloads." Role is always
  // wedding-scoped and re-checked per request via requireWeddingMember, never
  // trusted from a stale token.
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
}
