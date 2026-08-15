import { api } from '@/lib/api';
import { toSnakeCaseObject, toSnakeCaseArray } from '@/lib/caseMapping';
import type { Wedding, WeddingRole } from '@/types/database';

export interface WeddingWithRole extends Wedding {
  role: WeddingRole;
}

export async function fetchMyWeddings(): Promise<WeddingWithRole[]> {
  const { weddings } = await api.get<{ weddings: Record<string, unknown>[] }>('/weddings');
  return toSnakeCaseArray<WeddingWithRole>(weddings);
}

export interface CreateWeddingInput {
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date?: string | null;
  reception_date?: string | null;
  venue?: string | null;
  wedding_side: Wedding['wedding_side'];
}

export async function createWedding(input: CreateWeddingInput): Promise<Wedding> {
  const { wedding } = await api.post<{ wedding: Record<string, unknown> }>('/weddings', {
    name: input.name,
    brideName: input.bride_name,
    groomName: input.groom_name,
    weddingDate: input.wedding_date ?? null,
    receptionDate: input.reception_date ?? null,
    venue: input.venue ?? null,
    weddingSide: input.wedding_side,
  });
  return toSnakeCaseObject<Wedding>(wedding);
}

export async function deleteWedding(weddingId: string) {
  await api.delete(`/weddings/${weddingId}`);
}

export interface MyPendingInvitation {
  id: string;
  wedding_id: string;
  wedding_name: string | null;
  role: WeddingRole;
  token: string;
  expires_at: string;
}

export async function fetchMyPendingInvitations(): Promise<MyPendingInvitation[]> {
  const { invitations } = await api.get<{ invitations: Record<string, unknown>[] }>('/invitations/my-pending');
  return toSnakeCaseArray<MyPendingInvitation>(invitations);
}
