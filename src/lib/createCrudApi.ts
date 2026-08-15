import { api } from './api';
import { toCamelCaseObject, toSnakeCaseArray, toSnakeCaseObject } from './caseMapping';

// Nine of the app's modules (guests, vendors, expenses, ...) hit the
// backend's generic CRUD routes and only differ by path segment and type —
// see server/src/repositories/genericCrudRepository.ts for the backend
// half of this pattern. Frontend inputs/rows are snake_case (original
// Postgres-column-shaped types in each feature's types.ts); the backend
// speaks camelCase JSON — this factory does that conversion once instead
// of nine times.
export function createCrudApi<TRow, TInput extends object>(pathSegment: string) {
  async function fetchAll(weddingId: string): Promise<TRow[]> {
    const { items } = await api.get<{ items: Record<string, unknown>[] }>(
      `/weddings/${weddingId}/${pathSegment}`
    );
    return toSnakeCaseArray<TRow>(items);
  }

  async function create(weddingId: string, input: TInput): Promise<TRow> {
    const { item } = await api.post<{ item: Record<string, unknown> }>(
      `/weddings/${weddingId}/${pathSegment}`,
      toCamelCaseObject(input)
    );
    return toSnakeCaseObject<TRow>(item);
  }

  async function update(weddingId: string, id: string, input: Partial<TInput>): Promise<TRow> {
    const { item } = await api.patch<{ item: Record<string, unknown> }>(
      `/weddings/${weddingId}/${pathSegment}/${id}`,
      toCamelCaseObject(input)
    );
    return toSnakeCaseObject<TRow>(item);
  }

  async function remove(weddingId: string, id: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/${pathSegment}/${id}`);
  }

  return { fetchAll, create, update, remove };
}
