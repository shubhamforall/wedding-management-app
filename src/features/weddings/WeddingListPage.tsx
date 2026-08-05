import { Link, Navigate } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { useMyWeddings } from './hooks';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';

// '/' is never a page a signed-in user actually looks at — it's a router
// step. With any weddings, land straight on the most recent one (weddings
// are already ordered newest-first). Switching between multiple weddings
// happens via the sidebar's wedding switcher once inside the app, not here.
// Only a genuinely wedding-less account (brand new signup) sees anything.
export function WeddingListPage() {
  const { data: weddings, isLoading } = useMyWeddings();
  const { user } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  if (weddings && weddings.length > 0) {
    return <Navigate to={`/w/${weddings[0]!.id}`} replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full items-center justify-between">
        <p className="text-sm text-text-muted">{user?.email}</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <EmptyState
        icon={Heart}
        title="No weddings yet"
        description="Create your first wedding to start planning."
        action={
          <Link to="/weddings/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create a wedding
            </Button>
          </Link>
        }
      />
    </div>
  );
}
