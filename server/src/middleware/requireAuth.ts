import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { getAccessTokenCookie } from '../utils/authCookies';
import { AppError } from '../utils/AppError';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getAccessTokenCookie(req.cookies);
  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(AppError.unauthorized('Session expired.'));
  }
}
