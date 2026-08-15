import { api, API_URL } from '@/lib/api';
import type { AuthUser } from './types';

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { user } = await api.post<{ user: AuthUser }>('/auth/register', { email, password, fullName });
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
  return user;
}

// A full browser navigation, not a fetch — OAuth requires the browser
// itself to visit Google's consent screen and follow the redirect chain
// back through our backend, which sets the session cookies before landing
// on /auth/callback.
export function signInWithGoogle(): void {
  window.location.href = `${API_URL}/auth/google`;
}

export async function sendPasswordReset(email: string) {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string) {
  await api.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string) {
  await api.post('/auth/verify-email', { token });
}

export async function signOut() {
  await api.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { user } = await api.get<{ user: AuthUser }>('/auth/me');
    return user;
  } catch {
    return null;
  }
}
