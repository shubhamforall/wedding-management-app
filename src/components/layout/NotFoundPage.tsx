import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
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
