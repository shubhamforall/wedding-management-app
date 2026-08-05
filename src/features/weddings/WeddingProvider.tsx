import { createContext, use, useMemo, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { Wedding, WeddingRole } from '@/types/database';
import { useMyWeddings } from './hooks';

interface CurrentWeddingContextValue {
  wedding: Wedding;
  role: WeddingRole;
}

const CurrentWeddingContext = createContext<CurrentWeddingContextValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddings, error, isPending } = useMyWeddings();

  const value = useMemo(() => {
    const wedding = weddings?.find((item) => item.id === weddingId);
    return wedding ? { wedding, role: wedding.role } : null;
  }, [weddingId, weddings]);

  if (!weddingId || isPending) return <FullPageSpinner />;

  if (error) {
    throw error;
  }

  if (!value) {
    return <Navigate to="/" replace />;
  }

  return <CurrentWeddingContext value={value}>{children}</CurrentWeddingContext>;
}

export function useCurrentWedding() {
  const ctx = use(CurrentWeddingContext);
  if (!ctx) throw new Error('useCurrentWedding must be used within a WeddingProvider');
  return ctx;
}
