import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import * as api from './api';

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.fetchNotifications(user!.id),
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.is_read).length ?? 0;
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllAsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}
