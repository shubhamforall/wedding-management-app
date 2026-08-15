import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .nullable()
  .optional();

export const createWeddingSchema = z.object({
  name: z.string().trim().min(1).max(255),
  brideName: z.string().trim().min(1).max(255),
  groomName: z.string().trim().min(1).max(255),
  weddingDate: dateOnly,
  receptionDate: dateOnly,
  venue: z.string().trim().max(255).nullable().optional(),
  address: z.string().trim().nullable().optional(),
  weddingSide: z.enum(['groom', 'bride', 'both']).default('both'),
});

export const updateWeddingSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  brideName: z.string().trim().min(1).max(255).optional(),
  groomName: z.string().trim().min(1).max(255).optional(),
  weddingDate: dateOnly,
  receptionDate: dateOnly,
  venue: z.string().trim().max(255).nullable().optional(),
  address: z.string().trim().nullable().optional(),
  weddingSide: z.enum(['groom', 'bride', 'both']).optional(),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(['member', 'viewer']), // owner role changes only via transfer-ownership
});

export const transferOwnershipSchema = z.object({
  newOwnerMemberId: z.string().uuid(),
});
