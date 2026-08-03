import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { acceptInvitation } from './api';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    acceptInvitation(token)
      .then((membership) => navigate(`/w/${membership.wedding_id}`, { replace: true }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not accept invitation.'));
  }, [token, navigate]);

  if (!error) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-subtle px-4">
      <Card className="w-full max-w-sm space-y-4 p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-danger-bg text-danger">
          <CircleAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text">Couldn&apos;t accept invitation</h1>
          <p className="mt-1 text-sm text-text-muted">{error}</p>
        </div>
        <Link to="/">
          <Button variant="secondary" className="w-full">
            <Heart className="h-4 w-4" />
            Go to your weddings
          </Button>
        </Link>
      </Card>
    </div>
  );
}
