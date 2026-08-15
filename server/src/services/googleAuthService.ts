import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { createUserFromGoogle, findUserByEmail } from '../repositories/userRepository';
import { toPublicUser } from './authService';
import { createRefreshToken } from '../repositories/authTokenRepository';
import { signAccessToken } from '../utils/jwt';
import { generateSecureToken } from '../utils/secureToken';

const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

function getClient(): OAuth2Client {
  return new OAuth2Client(env.google.clientId, env.google.clientSecret, env.google.redirectUri);
}

export function isGoogleConfigured(): boolean {
  return !!(env.google.clientId && env.google.clientSecret);
}

// `state` is a random value the caller generates and stores in a short-lived
// cookie, then compares against what Google echoes back on the callback —
// standard OAuth CSRF protection (a forged callback request can't produce
// the matching state without also controlling the cookie).
export function getGoogleAuthUrl(state: string): string {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

export async function handleGoogleCallback(code: string) {
  if (!isGoogleConfigured()) throw AppError.badRequest('Google sign-in is not configured.');

  const client = getClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw AppError.badRequest('Google did not return an identity token.');

  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.google.clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw AppError.badRequest('Google account has no email address.');
  if (!payload.email_verified) throw AppError.forbidden('Google email address is not verified.');

  let user = await findUserByEmail(payload.email);
  if (!user) {
    user = await createUserFromGoogle({
      email: payload.email,
      fullName: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    });
  }

  const accessToken = signAccessToken(user.id);
  const { raw, hash } = generateSecureToken();
  await createRefreshToken(user.id, hash, new Date(Date.now() + REFRESH_TOKEN_MS));

  return { user: toPublicUser(user), tokens: { accessToken, refreshToken: raw } };
}
