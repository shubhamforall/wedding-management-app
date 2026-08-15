import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { TaskInput } from './types';

export const tasksQueryKey = (weddingId: string) => ['tasks', weddingId] as const;

export function useTasks(weddingId: string) {
  return useQuery({ queryKey: tasksQueryKey(weddingId), queryFn: () => api.fetchTasks(weddingId) });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, weddingId: string) {
  queryClient.invalidateQueries({ queryKey: tasksQueryKey(weddingId) });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats', weddingId] });
}

export function useCreateTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => api.createTask(weddingId, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useUpdateTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => api.updateTask(weddingId, id, input),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}

export function useDeleteTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(weddingId, id),
    onSuccess: () => invalidate(queryClient, weddingId),
  });
}
