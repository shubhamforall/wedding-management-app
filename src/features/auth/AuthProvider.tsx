import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cookie-based sessions have no client-visible "auth state changed" event
  // the way supabase-js's onAuthStateChange gave us — every login/logout
  // call site must call this explicitly afterward instead.
  const refreshAuth = useCallback(async () => {
    const current = await fetchCurrentUser();
    setUser(current);
  }, []);

  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false));
  }, [refreshAuth]);

  const value = useMemo(() => ({ user, isLoading, refreshAuth }), [user, isLoading, refreshAuth]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
