import { api } from '@/lib/api';
import { toSnakeCaseArray } from '@/lib/caseMapping';
import type { ListOption, ListType } from '@/types/database';

export async function fetchListOptions(weddingId: string, listType: ListType): Promise<ListOption[]> {
  const { options } = await api.get<{ options: Record<string, unknown>[] }>(
    `/weddings/${weddingId}/list-options`,
    { listType }
  );
  return toSnakeCaseArray<ListOption>(options);
}

export async function createListOption(weddingId: string, listType: ListType, value: string, sortOrder: number) {
  await api.post(`/weddings/${weddingId}/list-options`, { listType, value: value.trim(), sortOrder });
}

export async function updateListOptionValue(weddingId: string, id: string, value: string) {
  await api.patch(`/weddings/${weddingId}/list-options/${id}`, { value: value.trim() });
}

export async function updateListOptionOrder(weddingId: string, id: string, sortOrder: number) {
  await api.patch(`/weddings/${weddingId}/list-options/${id}`, { sortOrder });
}

export async function deleteListOption(weddingId: string, id: string) {
  await api.delete(`/weddings/${weddingId}/list-options/${id}`);
}
