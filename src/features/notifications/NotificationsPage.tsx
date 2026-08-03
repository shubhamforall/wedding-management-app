import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from './hooks';
import type { Notification, NotificationType } from './types';

dayjs.extend(relativeTime);

const typeIcon: Record<NotificationType, LucideIcon> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,
};

const typeTone: Record<NotificationType, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
};

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const Icon = typeIcon[notification.type];

  const body = (
    <Card
      className={cn('flex items-start gap-3 p-4', !notification.is_read && 'border-primary/40 bg-primary/5')}
      onClick={() => !notification.is_read && markRead.mutate(notification.id)}
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]', typeTone[notification.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{notification.title}</p>
        {notification.message && <p className="mt-0.5 text-sm text-text-muted">{notification.message}</p>}
        <p className="mt-1 text-xs text-text-faint">{dayjs(notification.created_at).fromNow()}</p>
      </div>
      {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </Card>
  );

  return notification.link ? (
    <Link to={notification.link} onClick={() => !notification.is_read && markRead.mutate(notification.id)}>
      {body}
    </Link>
  ) : (
    body
  );
}

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  if (isLoading) return <FullPageSpinner />;

  const hasUnread = (notifications ?? []).some((n) => !n.is_read);

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Notifications</h1>
        {hasUnread && (
          <Button size="sm" variant="secondary" onClick={() => markAllRead.mutate()} isLoading={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Member and role changes for your weddings show up here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
