import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createListOption,
  deleteListOption,
  findListOptionById,
  findListOptions,
  updateListOptionOrder,
  updateListOptionValue,
} from '../repositories/listOptionRepository';
import { toCamelCaseObject } from '../utils/caseMapping';
import { AppError } from '../utils/AppError';

const createSchema = z.object({
  listType: z.string().min(1).max(50),
  value: z.string().trim().min(1).max(255),
  sortOrder: z.number().int().default(0),
});

const updateSchema = z
  .object({
    value: z.string().trim().min(1).max(255).optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((v) => v.value !== undefined || v.sortOrder !== undefined, 'Nothing to update.');

export async function list(req: Request, res: Response) {
  const listType = String(req.query.listType ?? '');
  if (!listType) throw AppError.badRequest('listType query param is required.');
  const rows = await findListOptions(req.params.weddingId!, listType);
  res.json({ success: true, options: rows.map((r) => ({ ...toCamelCaseObject(r), isActive: !!r.is_active })) });
}

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const row = await createListOption(req.params.weddingId!, input.listType, input.value, input.sortOrder);
  res.status(201).json({ success: true, option: toCamelCaseObject(row) });
}

async function assertBelongsToWedding(id: string, weddingId: string) {
  const row = await findListOptionById(id);
  if (!row || row.wedding_id !== weddingId) throw AppError.notFound();
  return row;
}

export async function update(req: Request, res: Response) {
  await assertBelongsToWedding(req.params.id!, req.params.weddingId!);
  const input = updateSchema.parse(req.body);
  if (input.value !== undefined) await updateListOptionValue(req.params.id!, input.value);
  if (input.sortOrder !== undefined) await updateListOptionOrder(req.params.id!, input.sortOrder);
  const row = await findListOptionById(req.params.id!);
  res.json({ success: true, option: toCamelCaseObject(row!) });
}

export async function remove(req: Request, res: Response) {
  await assertBelongsToWedding(req.params.id!, req.params.weddingId!);
  await deleteListOption(req.params.id!);
  res.json({ success: true });
}
