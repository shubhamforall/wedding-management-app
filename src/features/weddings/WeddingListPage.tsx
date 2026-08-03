import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { useMyWeddings } from './hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';

export function WeddingListPage() {
  const { data: weddings, isLoading } = useMyWeddings();
  const { user } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Your weddings</h1>
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      {weddings && weddings.length > 0 ? (
        <div className="space-y-3">
          {weddings.map((w) => (
            <Link key={w.id} to={`/w/${w.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-primary">
                <div>
                  <p className="font-medium text-text">{w.name}</p>
                  <p className="text-sm text-text-muted">
                    {w.bride_name} &amp; {w.groom_name}
                    {w.wedding_date && ` · ${dayjs(w.wedding_date).format('DD MMM YYYY')}`}
                  </p>
                </div>
                <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-medium capitalize text-text-muted">
                  {w.role}
                </span>
              </Card>
            </Link>
          ))}
          <Link to="/weddings/new">
            <Button variant="secondary" className="w-full">
              <Plus className="h-4 w-4" />
              Create another wedding
            </Button>
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
