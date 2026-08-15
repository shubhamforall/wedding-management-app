import { Link, Navigate, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthProvider';

export function NotFoundPage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  // An unmatched path for a signed-out visitor is far more likely to be an
  // expired session or a stale/bad link than someone deliberately exploring
  // — send them to log in (preserving where they were headed) rather than
  // a dead-end 404 page they can't act on.
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-bg-subtle px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-text">Page not found</h1>
        <p className="mt-1 text-sm text-text-muted">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      </div>
      <Link to="/">
        <Button>Back to your weddings</Button>
      </Link>
    </div>
  );
}
