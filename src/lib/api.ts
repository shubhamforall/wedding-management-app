export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

// Auth is entirely cookie-based (HttpOnly access/refresh tokens set by the
// backend) — credentials:'include' on every call is what replaces
// supabase-js's invisible session handling. No token ever touches JS here.
async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  let res = await fetch(url, {
    method,
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Access token expired mid-session (1h) — try one silent refresh, same
  // recovery Supabase's autoRefreshToken gave us for free, then retry once.
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshed.ok) {
      res = await fetch(url, {
        method,
        credentials: 'include',
        headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export async function uploadFile<T>(path: string, file: File, fields?: Record<string, string>): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  if (fields) for (const [key, value] of Object.entries(fields)) form.append(key, value);

  const res = await fetch(`${API_URL}${path}`, { method: 'POST', credentials: 'include', body: form });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `Upload failed (${res.status})`);
  return data as T;
}

export function downloadFileUrl(path: string): string {
  return `${API_URL}${path}`;
}
