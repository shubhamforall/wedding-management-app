import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullPageSpinner } from '@/components/ui/Spinner';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
