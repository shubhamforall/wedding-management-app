export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  user_id: string;
  wedding_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
