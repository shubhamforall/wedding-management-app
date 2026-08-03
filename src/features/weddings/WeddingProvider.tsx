import { createContext, use, useMemo, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { Wedding, WeddingRole } from '@/types/database';

interface CurrentWeddingContextValue {
  wedding: Wedding;
  role: WeddingRole;
}

const CurrentWeddingContext = createContext<CurrentWeddingContextValue | null>(null);

interface MembershipRow {
  role: WeddingRole;
  weddings: Wedding | null;
}

async function fetchWeddingWithRole(weddingId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from('wedding_members')
    .select('role, weddings(*)')
    .eq('wedding_id', weddingId)
    .eq('status', 'active')
    .maybeSingle()
    .returns<MembershipRow>();

  if (membershipError) throw membershipError;
  if (!membership || !membership.weddings) return null;

  return {
    wedding: membership.weddings,
    role: membership.role,
  };
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { weddingId } = useParams<{ weddingId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['wedding', weddingId],
    queryFn: () => fetchWeddingWithRole(weddingId!),
    enabled: !!weddingId,
  });

  const value = useMemo(() => (data ? { wedding: data.wedding, role: data.role } : null), [data]);

  if (isLoading) return <FullPageSpinner />;

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
