import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      membership?: { role: 'owner' | 'member' | 'viewer'; memberId: string };
    }
  }
}
