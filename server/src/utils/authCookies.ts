import type { Response } from 'express';
import { env } from '../config/env';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * ONE_HOUR_MS;

const baseCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...baseCookieOptions, maxAge: ONE_HOUR_MS });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookieOptions, maxAge: THIRTY_DAYS_MS });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
}

export function getAccessTokenCookie(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[ACCESS_COOKIE];
}

export function getRefreshTokenCookie(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[REFRESH_COOKIE];
}
