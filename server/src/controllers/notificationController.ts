import type { Request, Response } from 'express';
import {
  findNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../repositories/notificationRepository';
import { toCamelCaseObject } from '../utils/caseMapping';

export async function list(req: Request, res: Response) {
  const rows = await findNotificationsForUser(req.user!.id);
  res.json({
    success: true,
    notifications: rows.map((r) => ({ ...toCamelCaseObject(r), isRead: !!r.is_read })),
  });
}

export async function markRead(req: Request, res: Response) {
  await markNotificationRead(req.params.id!, req.user!.id);
  res.json({ success: true });
}

export async function markAllRead(req: Request, res: Response) {
  await markAllNotificationsRead(req.user!.id);
  res.json({ success: true });
}
