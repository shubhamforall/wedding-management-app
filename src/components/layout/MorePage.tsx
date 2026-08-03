import { Link } from 'react-router-dom';
import { moreNav } from '@/app/navigation';
import { Card } from '@/components/ui/Card';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks';

export function MorePage() {
  const unreadCount = useUnreadNotificationsCount();

  return (
    <div className="p-4 pt-6">
      <h1 className="mb-4 text-lg font-semibold text-text">More</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {moreNav.map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="relative flex flex-col items-center gap-2 p-4 text-center transition-colors hover:border-primary">
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <item.icon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-text">{item.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
