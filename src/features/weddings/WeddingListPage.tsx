import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Mail, Plus } from 'lucide-react';
import { useMyPendingInvitations, useMyWeddings } from './hooks';
import { acceptInvitation } from '@/features/members/api';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';

// '/' is never a page a signed-in user actually looks at — it's a router
// step. With any weddings and no pending invites, land straight on the
// most recent one (weddings are already ordered newest-first). A pending
// invitation always takes priority over that auto-redirect, regardless of
// how the visitor got here (fresh signup, closed tab and came back later,
// whatever) — this doesn't depend on them being on the exact /invite/:token
// URL at the right moment, unlike the token-in-localStorage path used
// during the signup/verification journey itself.
export function WeddingListPage() {
  const { data: weddings, isLoading: weddingsLoading } = useMyWeddings();
  const { data: pendingInvitations, isLoading: invitesLoading } = useMyPendingInvitations();
  const { user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (weddingsLoading || invitesLoading) return <FullPageSpinner />;

  const hasPendingInvites = pendingInvitations && pendingInvitations.length > 0;

  if (!hasPendingInvites && weddings && weddings.length > 0) {
    return <Navigate to={`/w/${weddings[0]!.id}`} replace />;
  }

  const accept = async (token: string) => {
    setAcceptingId(token);
    try {
      const membership = await acceptInvitation(token);
      await queryClient.invalidateQueries({ queryKey: ['weddings'] });
      navigate(`/w/${membership.wedding_id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not accept invitation.');
      setAcceptingId(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-subtle">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <p className="text-sm text-text-muted">{user?.email}</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => signOut().then(refreshAuth)}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-fg">
              {hasPendingInvites ? <Mail className="h-5 w-5" /> : <Heart className="h-5 w-5" fill="currentColor" />}
            </div>
            <h1 className="text-xl font-semibold text-text">
              {hasPendingInvites ? "You've been invited!" : 'No weddings yet'}
            </h1>
            <p className="text-sm text-text-muted">
              {hasPendingInvites
                ? 'Accept an invitation below to start collaborating.'
                : 'Create your first wedding to start planning.'}
            </p>
          </div>

          {hasPendingInvites ? (
            <div className="space-y-3">
              {pendingInvitations!.map((invite) => (
                <Card key={invite.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{invite.wedding_name ?? 'A wedding'}</p>
                    <Badge tone="info" className="mt-1 capitalize">
                      {invite.role}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => accept(invite.token)} isLoading={acceptingId === invite.token}>
                    Accept
                  </Button>
                </Card>
              ))}
              {weddings && weddings.length > 0 && (
                <Link
                  to={`/w/${weddings[0]!.id}`}
                  className="block text-center text-sm text-text-muted hover:text-text"
                >
                  Skip for now, go to {weddings[0]!.name}
                </Link>
              )}
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={Heart}
                title=""
                description=""
                action={
                  <Link to="/weddings/new">
                    <Button className="w-full">
                      <Plus className="h-4 w-4" />
                      Create a wedding
                    </Button>
                  </Link>
                }
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
