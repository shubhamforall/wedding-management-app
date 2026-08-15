import type { Request, Response } from 'express';
import { fetchDashboardStats } from '../repositories/dashboardRepository';
import { toCamelCaseObject } from '../utils/caseMapping';

export async function stats(req: Request, res: Response) {
  const row = await fetchDashboardStats(req.params.weddingId!);
  res.json({ success: true, stats: toCamelCaseObject(row) });
}
