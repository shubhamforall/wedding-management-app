import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { TimelineEventInput } from './types';

export const timelineQueryKey = (weddingId: string) => ['timeline-events', weddingId] as const;

export function useTimelineEvents(weddingId: string) {
  return useQuery({ queryKey: timelineQueryKey(weddingId), queryFn: () => api.fetchTimelineEvents(weddingId) });
}

export function useCreateTimelineEvent(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TimelineEventInput) => api.createTimelineEvent(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timelineQueryKey(weddingId) }),
  });
}

export function useUpdateTimelineEvent(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TimelineEventInput }) => api.updateTimelineEvent(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timelineQueryKey(weddingId) }),
  });
}

export function useDeleteTimelineEvent(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimelineEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timelineQueryKey(weddingId) }),
  });
}
