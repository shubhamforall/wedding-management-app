import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import type { ZodSchema } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { requireWeddingMember, requireRole } from '../middleware/requireWeddingMember';
import { createCrudRepository } from '../repositories/genericCrudRepository';
import { toCamelCaseObject, toSnakeCaseObject } from '../utils/caseMapping';
import { AppError } from '../utils/AppError';
import type { WeddingRole } from '../repositories/weddingMemberRepository';

interface SimpleCrudConfig {
  table: string;
  columns: string[]; // snake_case DB column names, excluding id/wedding_id/created_at/updated_at
  orderBy: string;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  booleanFields?: string[]; // camelCase keys to coerce 0/1 -> boolean in responses
  writeRole?: WeddingRole; // minimum role to create/update/delete — defaults to 'member'
}

// Wires the generic repository to a full Express router for one of the
// eleven identical-shape modules (guests, vendors, expenses, ...) — see
// genericCrudRepository.ts for why this is factored out instead of eleven
// near-duplicate route files.
export function createSimpleCrudRouter(config: SimpleCrudConfig): Router {
  const repo = createCrudRepository({ table: config.table, columns: config.columns, orderBy: config.orderBy });
  const writeRole = config.writeRole ?? 'member';
  const boolFields = new Set(config.booleanFields ?? []);

  function serialize(row: RowDataPacket) {
    const camel = toCamelCaseObject(row);
    for (const field of boolFields) {
      if (field in camel) camel[field] = !!camel[field];
    }
    return camel;
  }

  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWeddingMember);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const rows = await repo.findAll(req.params.weddingId!);
      res.json({ success: true, items: rows.map(serialize) });
    })
  );

  router.post(
    '/',
    requireRole(writeRole),
    asyncHandler(async (req, res) => {
      const input = config.createSchema.parse(req.body);
      const row = await repo.create(req.params.weddingId!, toSnakeCaseObject(input));
      res.status(201).json({ success: true, item: serialize(row) });
    })
  );

  router.patch(
    '/:id',
    requireRole(writeRole),
    asyncHandler(async (req, res) => {
      const belongs = await repo.belongsToWedding(req.params.id!, req.params.weddingId!);
      if (!belongs) throw AppError.notFound();

      const input = config.updateSchema.parse(req.body);
      const row = await repo.update(req.params.id!, toSnakeCaseObject(input));
      res.json({ success: true, item: serialize(row) });
    })
  );

  router.delete(
    '/:id',
    requireRole(writeRole),
    asyncHandler(async (req, res) => {
      const belongs = await repo.belongsToWedding(req.params.id!, req.params.weddingId!);
      if (!belongs) throw AppError.notFound();

      await repo.remove(req.params.id!);
      res.json({ success: true });
    })
  );

  return router;
}
