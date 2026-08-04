import { Link, Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WeddingProvider } from '@/features/weddings/WeddingProvider';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks';

function NotificationButton() {
  const unreadCount = useUnreadNotificationsCount();

  return (
    <Link
      to="notifications"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-raised text-text-muted transition-colors hover:bg-bg-subtle hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

// A real row in the document flow, not a fixed overlay — every page's own
// top-right button (Add Task, Add Family, ...) lives in normal page content
// below this, so nothing can ever render underneath/behind these two icons.
function TopBar() {
  return (
    <div className="sticky top-0 z-30 flex justify-end gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur md:px-6">
      <ThemeToggle />
      <NotificationButton />
    </div>
  );
}

export function AppShell() {
  return (
    <WeddingProvider>
      <div className="min-h-screen bg-bg">
        <Sidebar />
        <BottomNav />
        <main className="min-h-screen pb-20 md:ml-64 md:pb-0">
          <TopBar />
          <Outlet />
        </main>
      </div>
    </WeddingProvider>
  );
}
