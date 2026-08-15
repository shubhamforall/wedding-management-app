import type { NextFunction, Request, Response } from 'express';
import { findActiveMembership, roleAtLeast, type WeddingRole } from '../repositories/weddingMemberRepository';
import { AppError } from '../utils/AppError';

// The RLS replacement (see MIGRATION_ANALYSIS.md Section F): every
// wedding-scoped route must run this before touching wedding-scoped data.
// 404, not 403, on no membership — don't confirm a wedding exists to a
// non-member by leaking a different status code.
export function requireWeddingMember(req: Request, _res: Response, next: NextFunction): void {
  const weddingId = req.params.weddingId;
  if (!weddingId) {
    next(AppError.badRequest('Missing weddingId.'));
    return;
  }

  findActiveMembership(weddingId, req.user!.id)
    .then((membership) => {
      if (!membership) {
        next(AppError.notFound('Wedding not found.'));
        return;
      }
      req.membership = { role: membership.role, memberId: membership.id };
      next();
    })
    .catch(next);
}

export function requireRole(minRole: WeddingRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.membership || !roleAtLeast(req.membership.role, minRole)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
}
