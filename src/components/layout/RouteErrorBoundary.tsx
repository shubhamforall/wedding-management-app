import { Link, useRouteError } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Something went wrong loading this page.';

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-bg-subtle px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <CircleAlert className="h-6 w-6" />
      </div>
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold text-text">Something broke</h1>
        <p className="mt-1 text-sm text-text-muted">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Link to="/">
          <Button>Back to your weddings</Button>
        </Link>
      </div>
    </div>
  );
}
