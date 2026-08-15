import { useQuery } from '@tanstack/react-query';
import { fetchListOptions } from '@/features/settings/api';
import type { ListType } from '@/types/database';

export function useListOptions(weddingId: string, listType: ListType) {
  return useQuery({
    queryKey: ['list-options', weddingId, listType],
    queryFn: () => fetchListOptions(weddingId, listType),
    staleTime: 5 * 60_000,
  });
}
