import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WeddingProvider, useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks';

function NotificationButton() {
  const { wedding } = useCurrentWedding();
  const unreadCount = useUnreadNotificationsCount();

  return (
    <Link
      to={`/w/${wedding.id}/notifications`}
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
// below this, so nothing can ever render underneath/behind these icons.
function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur md:justify-end md:px-6">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-raised text-text-muted transition-colors hover:bg-bg-subtle hover:text-text md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationButton />
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <WeddingProvider>
      <div className="min-h-screen bg-bg">
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="min-h-screen md:ml-64">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <Outlet />
        </main>
      </div>
    </WeddingProvider>
  );
}
