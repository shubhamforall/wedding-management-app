// The backend responds with camelCase JSON; every frontend type in
// src/types/database.ts and each feature's types.ts is snake_case (was
// written against Postgres/PostgREST's column-name convention originally).
// Converting at the API boundary here means every hook/component/type
// downstream is untouched — only each feature's api.ts needs to know this
// conversion exists.
export function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function toCamelCaseObject<T = Record<string, unknown>>(obj: object): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[snakeToCamel(key)] = value;
  }
  return out as T;
}

export function toSnakeCaseObject<T = Record<string, unknown>>(obj: object): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[camelToSnake(key)] = value;
  }
  return out as T;
}

export function toSnakeCaseArray<T = Record<string, unknown>>(rows: object[]): T[] {
  return rows.map((row) => toSnakeCaseObject<T>(row));
}
