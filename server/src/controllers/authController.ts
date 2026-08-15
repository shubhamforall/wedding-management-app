import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import * as authService from '../services/authService';
import * as googleAuthService from '../services/googleAuthService';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/authValidators';
import { clearAuthCookies, getRefreshTokenCookie, setAuthCookies } from '../utils/authCookies';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const GOOGLE_STATE_COOKIE = 'google_oauth_state';

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register({
    email: input.email,
    password: input.password,
    fullName: input.fullName ?? null,
  });
  setAuthCookies(res, tokens);
  res.status(201).json({ success: true, user });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(input.email, input.password);
  setAuthCookies(res, tokens);
  res.json({ success: true, user });
}

export async function refresh(req: Request, res: Response) {
  const rawRefreshToken = getRefreshTokenCookie(req.cookies);
  if (!rawRefreshToken) throw AppError.unauthorized();

  const { user, tokens } = await authService.refreshSession(rawRefreshToken);
  setAuthCookies(res, tokens);
  res.json({ success: true, user });
}

export async function logout(req: Request, res: Response) {
  const rawRefreshToken = getRefreshTokenCookie(req.cookies);
  await authService.logout(rawRefreshToken);
  clearAuthCookies(res);
  res.json({ success: true });
}

export async function forgotPassword(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(input.email);
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(input.token, input.password);
  res.json({ success: true });
}

export async function verifyEmail(req: Request, res: Response) {
  const input = verifyEmailSchema.parse(req.body);
  await authService.verifyEmail(input.token);
  res.json({ success: true });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ success: true, user });
}

export async function googleStart(_req: Request, res: Response) {
  if (!googleAuthService.isGoogleConfigured()) {
    throw AppError.badRequest('Google sign-in is not configured.');
  }

  const state = randomBytes(16).toString('hex');
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
    path: '/',
  });
  res.redirect(googleAuthService.getGoogleAuthUrl(state));
}

// Google redirects the browser here directly (not an XHR call from the
// frontend), so on any failure this must redirect somewhere sensible too —
// throwing a JSON error would just show raw JSON in the user's browser.
export async function googleCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;
  const expectedState = req.cookies[GOOGLE_STATE_COOKIE];
  res.clearCookie(GOOGLE_STATE_COOKIE, { path: '/' });

  const failure = (reason: string) => res.redirect(`${env.appUrl}/auth/login?error=${encodeURIComponent(reason)}`);

  if (error) return failure('google_denied');
  if (typeof code !== 'string') return failure('google_missing_code');
  if (!expectedState || state !== expectedState) return failure('google_invalid_state');

  try {
    const { tokens } = await googleAuthService.handleGoogleCallback(code);
    setAuthCookies(res, tokens);
    res.redirect(`${env.appUrl}/auth/callback`);
  } catch {
    failure('google_auth_failed');
  }
}
