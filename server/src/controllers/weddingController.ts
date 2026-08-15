import type { Request, Response } from 'express';
import * as weddingService from '../services/weddingService';
import { createWeddingSchema, updateWeddingSchema } from '../validators/weddingValidators';
import { AppError } from '../utils/AppError';
import type { WeddingRow, WeddingWithRoleRow } from '../repositories/weddingRepository';

function serializeWedding(w: WeddingRow) {
  return {
    id: w.id,
    name: w.name,
    brideName: w.bride_name,
    groomName: w.groom_name,
    weddingDate: w.wedding_date,
    receptionDate: w.reception_date,
    venue: w.venue,
    address: w.address,
    weddingSide: w.wedding_side,
    ownerId: w.owner_id,
    isArchived: !!w.is_archived,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

function serializeWeddingWithRole(w: WeddingWithRoleRow) {
  return { ...serializeWedding(w), role: w.role };
}

export async function listMine(req: Request, res: Response) {
  const weddings = await weddingService.listMyWeddings(req.user!.id);
  res.json({ success: true, weddings: weddings.map(serializeWeddingWithRole) });
}

export async function create(req: Request, res: Response) {
  const input = createWeddingSchema.parse(req.body);
  const wedding = await weddingService.createWedding({
    name: input.name,
    brideName: input.brideName,
    groomName: input.groomName,
    weddingDate: input.weddingDate ?? null,
    receptionDate: input.receptionDate ?? null,
    venue: input.venue ?? null,
    address: input.address ?? null,
    weddingSide: input.weddingSide,
    ownerId: req.user!.id,
  });
  res.status(201).json({ success: true, wedding: serializeWedding(wedding) });
}

export async function getOne(req: Request, res: Response) {
  const wedding = await weddingService.getWedding(req.params.weddingId!);
  res.json({ success: true, wedding: serializeWedding(wedding), role: req.membership!.role });
}

export async function update(req: Request, res: Response) {
  const input = updateWeddingSchema.parse(req.body);
  const wedding = await weddingService.updateWedding(req.params.weddingId!, input);
  res.json({ success: true, wedding: serializeWedding(wedding) });
}

export async function remove(req: Request, res: Response) {
  if (req.membership!.role !== 'owner') throw AppError.forbidden('Only the owner can delete a wedding.');
  await weddingService.deleteWedding(req.params.weddingId!);
  res.json({ success: true });
}
