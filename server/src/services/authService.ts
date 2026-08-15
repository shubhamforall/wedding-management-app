import { AppError } from '../utils/AppError';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { generateSecureToken, hashToken } from '../utils/secureToken';
import { env } from '../config/env';
import {
  createUser,
  findUserByEmail,
  findUserById,
  markEmailVerified,
  updatePasswordHash,
  type UserRow,
} from '../repositories/userRepository';
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createRefreshToken,
  deleteEmailVerificationToken,
  findValidEmailVerificationToken,
  findValidPasswordResetToken,
  findValidRefreshToken,
  markPasswordResetTokenUsed,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
} from '../repositories/authTokenRepository';
import { sendPasswordResetEmail, sendVerificationEmail } from './email/email.service';

const HOUR_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_MS = 30 * 24 * HOUR_MS;

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    phone: user.phone,
    emailVerified: !!user.email_verified,
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(userId: string): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId);
  const { raw, hash } = generateSecureToken();
  await createRefreshToken(userId, hash, new Date(Date.now() + REFRESH_TOKEN_MS));
  return { accessToken, refreshToken: raw };
}

export async function register(input: { email: string; password: string; fullName: string | null }) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw AppError.conflict('An account with this email already exists.');

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ email: input.email, passwordHash, fullName: input.fullName });

  // Best-effort, matching the old Edge Function's swallow-on-failure
  // pattern — the account is real even if the verification email fails.
  const { raw, hash } = generateSecureToken();
  await createEmailVerificationToken(user.id, hash, new Date(Date.now() + 24 * HOUR_MS));
  void sendVerificationEmail(user.email, `${env.appUrl}/auth/callback?token=${raw}&type=verify`);

  // Matches the live app's current Supabase config: email confirmation is
  // NOT required before login (HANDOFF.md notes signup can return an active
  // session immediately) — so a session is issued right away here too.
  const tokens = await issueTokens(user.id);
  return { user: toPublicUser(user), tokens };
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.password_hash) throw AppError.unauthorized('Invalid email or password.');

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw AppError.unauthorized('Invalid email or password.');

  const tokens = await issueTokens(user.id);
  return { user: toPublicUser(user), tokens };
}

export async function refreshSession(rawRefreshToken: string) {
  const hash = hashToken(rawRefreshToken);
  const stored = await findValidRefreshToken(hash);
  if (!stored) throw AppError.unauthorized('Session expired, please log in again.');

  const user = await findUserById(stored.user_id);
  if (!user) throw AppError.unauthorized('Session expired, please log in again.');

  // Rotate: the old refresh token is single-use, same reasoning as
  // Supabase's own refresh-token-rotation, which HANDOFF.md's earlier
  // debugging already established this app is sensitive to.
  await revokeRefreshToken(stored.id);
  const tokens = await issueTokens(user.id);
  return { user: toPublicUser(user), tokens };
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  const stored = await findValidRefreshToken(hashToken(rawRefreshToken));
  if (stored) await revokeRefreshToken(stored.id);
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  // Always behave the same regardless of whether the email exists — never
  // let this endpoint's response enable user enumeration.
  if (user) {
    const { raw, hash } = generateSecureToken();
    await createPasswordResetToken(user.id, hash, new Date(Date.now() + HOUR_MS));
    void sendPasswordResetEmail(user.email, `${env.appUrl}/auth/reset-password?token=${raw}`);
  }
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const hash = hashToken(rawToken);
  const stored = await findValidPasswordResetToken(hash);
  if (!stored) throw AppError.badRequest('This reset link is invalid or has expired.');

  const passwordHash = await hashPassword(newPassword);
  await updatePasswordHash(stored.user_id, passwordHash);
  await markPasswordResetTokenUsed(stored.id);
  // Force re-login everywhere else — a password reset should invalidate
  // any session that might have been compromised.
  await revokeAllRefreshTokensForUser(stored.user_id);
}

export async function verifyEmail(rawToken: string) {
  const hash = hashToken(rawToken);
  const stored = await findValidEmailVerificationToken(hash);
  if (!stored) throw AppError.badRequest('This verification link is invalid or has expired.');

  await markEmailVerified(stored.user_id);
  await deleteEmailVerificationToken(stored.id);
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw AppError.unauthorized();
  return toPublicUser(user);
}
