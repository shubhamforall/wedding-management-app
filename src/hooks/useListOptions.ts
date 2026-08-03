import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ListOption, ListType } from '@/types/database';

async function fetchListOptions(weddingId: string, listType: ListType): Promise<ListOption[]> {
  const { data, error } = await supabase
    .from('list_options')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('list_type', listType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .returns<ListOption[]>();

  if (error) throw error;
  return data ?? [];
}

export function useListOptions(weddingId: string, listType: ListType) {
  return useQuery({
    queryKey: ['list-options', weddingId, listType],
    queryFn: () => fetchListOptions(weddingId, listType),
    staleTime: 5 * 60_000,
  });
}
