import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { accountPanelNav } from '@/app/navigation';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';

// Slides in from the right, opened via the profile avatar in AppShell's
// TopBar. Holds the account/workspace-management surfaces (Wedding Info,
// Members, Settings) that used to live in the sidebar — moved here since
// they're visited far less often than the daily planning modules, so the
// sidebar can stay short. Same overlay pattern as Sidebar's mobile drawer,
// mirrored to the right edge.
export function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refreshAuth } = useAuth();
  const userName = user?.fullName ?? null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button aria-label="Close account panel" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-80 max-w-[90vw] flex-col border-l border-border bg-bg-raised p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Account</p>
          <button
            type="button"
            aria-label="Close account panel"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] bg-bg-subtle p-3">
          <Avatar name={userName} email={user?.email} avatarUrl={user?.avatarUrl ?? null} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{userName ?? 'User profile'}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {accountPanelNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-subtle hover:text-text'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
            onClick={() => signOut().then(refreshAuth)}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
