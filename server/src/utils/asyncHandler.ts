import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Every controller is async; Express doesn't await handlers on its own, so
// a rejected promise would otherwise become an unhandled rejection instead
// of reaching errorHandler. Wrap every route with this.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
