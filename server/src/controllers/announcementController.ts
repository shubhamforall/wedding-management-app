import type { Request, Response } from 'express';
import { z } from 'zod';
import { findAnnouncement, updateAnnouncement } from '../repositories/announcementRepository';

const updateSchema = z.object({ message: z.string().max(5000) });

export async function get(req: Request, res: Response) {
  const row = await findAnnouncement(req.params.weddingId!);
  res.json({ success: true, message: row?.message ?? null, updatedAt: row?.updated_at ?? null });
}

export async function update(req: Request, res: Response) {
  const input = updateSchema.parse(req.body);
  await updateAnnouncement(req.params.weddingId!, input.message, req.user!.id);
  res.json({ success: true });
}
