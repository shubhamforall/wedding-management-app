import { api } from '@/lib/api';
import { toSnakeCaseObject } from '@/lib/caseMapping';
import type { DashboardStats } from './types';

export async function fetchDashboardStats(weddingId: string): Promise<DashboardStats> {
  const { stats } = await api.get<{ stats: Record<string, unknown> }>(`/weddings/${weddingId}/dashboard`);
  return { ...toSnakeCaseObject<DashboardStats>(stats), wedding_id: weddingId };
}
