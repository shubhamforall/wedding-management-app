import type { Request, Response } from 'express';
import { z } from 'zod';
import { fetchBudgetSummary, updateBudgetLineAmount } from '../repositories/budgetRepository';
import { toCamelCaseObject } from '../utils/caseMapping';

const updateSchema = z.object({ estimatedAmount: z.number().nonnegative() });

export async function summary(req: Request, res: Response) {
  const rows = await fetchBudgetSummary(req.params.weddingId!);
  res.json({ success: true, lines: rows.map(toCamelCaseObject) });
}

export async function updateLine(req: Request, res: Response) {
  const input = updateSchema.parse(req.body);
  await updateBudgetLineAmount(req.params.id!, req.params.weddingId!, input.estimatedAmount);
  const rows = await fetchBudgetSummary(req.params.weddingId!);
  res.json({ success: true, lines: rows.map(toCamelCaseObject) });
}
