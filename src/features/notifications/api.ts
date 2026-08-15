import { api } from '@/lib/api';
import { toSnakeCaseArray } from '@/lib/caseMapping';
import type { Notification } from './types';

// userId param kept for call-site compatibility (queryKey still includes
// it) even though the backend now derives "current user" from the auth
// cookie rather than a client-supplied id.
export async function fetchNotifications(_userId: string): Promise<Notification[]> {
  const { notifications } = await api.get<{ notifications: Record<string, unknown>[] }>('/notifications');
  return toSnakeCaseArray<Notification>(notifications);
}

export async function markAsRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(_userId: string) {
  await api.patch('/notifications/read-all');
}
