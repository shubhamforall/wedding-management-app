import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `No route: ${req.method} ${req.path}` });
}

// Express only recognizes 4-arg functions as error middleware, so req/next
// must stay in the signature even though this handler doesn't use them.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // Never leak SQL errors, stack traces, or internal details to the client.
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong.',
    ...(env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
  });
}
