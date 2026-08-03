import { NavLink } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { primaryNav, moreNav } from '@/app/navigation';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks';

const allNav = [...primaryNav.filter((i) => i.label !== 'More'), ...moreNav];

export function Sidebar() {
  const { wedding } = useCurrentWedding();
  const unreadCount = useUnreadNotificationsCount();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-bg-raised p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-fg">
          <Heart className="h-4 w-4" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{wedding.name}</p>
          <p className="text-xs text-text-muted">Wedding workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {allNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ''}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-subtle hover:text-text'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
