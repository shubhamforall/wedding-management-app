import { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Copy, MoreVertical, Plus, RotateCw, Trash2, UserCog } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { InviteMemberDialog } from './InviteMemberDialog';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import {
  useChangeMemberRole,
  useMembers,
  usePendingInvitations,
  useRemoveMember,
  useResendInvitation,
  useRevokeInvitation,
} from './hooks';
import type { MemberRow } from './types';
import type { WeddingRole } from '@/types/database';

function roleTone(role: WeddingRole) {
  if (role === 'owner') return 'info' as const;
  if (role === 'member') return 'success' as const;
  return 'neutral' as const;
}

export function MembersPage() {
  const { wedding, role } = useCurrentWedding();
  const { user } = useAuth();
  const isOwner = role === 'owner';

  const { data: members, isLoading: membersLoading } = useMembers(wedding.id);
  const { data: invitations, isLoading: invitationsLoading } = usePendingInvitations(wedding.id);

  const changeMemberRole = useChangeMemberRole(wedding.id);
  const removeMember = useRemoveMember(wedding.id);
  const resendInvitation = useResendInvitation(wedding.id);
  const revokeInvitation = useRevokeInvitation(wedding.id);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberRow | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null);

  if (membersLoading) return <FullPageSpinner />;

  const me = members?.find((m) => m.user_id === user?.id);
  const otherMembers = members?.filter((m) => m.user_id !== user?.id) ?? [];

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success('Invite link copied.');
  };

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Members</h1>
        {isOwner && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {members?.map((member) => {
          const isSelf = member.user_id === user?.id;
          const canManage = isOwner && !isSelf;
          return (
            <Card key={member.id} className="flex items-center gap-3 p-3">
              <Avatar
                name={member.user_profiles?.full_name}
                email={null}
                avatarUrl={member.user_profiles?.avatar_url}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {member.user_profiles?.full_name ?? 'Unnamed member'}
                  {isSelf && <span className="ml-1.5 text-xs text-text-faint">(you)</span>}
                </p>
                <p className="text-xs text-text-muted">
                  Joined {dayjs(member.joined_at).format('DD MMM YYYY')}
                </p>
              </div>

              {canManage && member.role !== 'owner' ? (
                <Select
                  className="!h-9 w-28"
                  value={member.role}
                  onChange={(e) =>
                    changeMemberRole.mutate({ memberId: member.id, role: e.target.value as WeddingRole })
                  }
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </Select>
              ) : (
                <Badge tone={roleTone(member.role)}>{member.role}</Badge>
              )}

              {canManage && member.role !== 'owner' && (
                <button
                  aria-label="Remove member"
                  onClick={() => setMemberToRemove(member)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {isOwner && (
        <div className="mt-8">
          <Button variant="secondary" className="w-full" onClick={() => setTransferOpen(true)}>
            <UserCog className="h-4 w-4" />
            Transfer Ownership
          </Button>
        </div>
      )}

      {isOwner && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-text">Pending Invitations</h2>
          {invitationsLoading ? (
            <FullPageSpinner />
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <Card key={inv.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{inv.email}</p>
                    <p className="text-xs text-text-muted">
                      {inv.role} · expires {dayjs(inv.expires_at).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <button
                    aria-label="Copy invite link"
                    onClick={() => copyInviteLink(inv.token)}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Resend invitation"
                    onClick={() => resendInvitation.mutate(inv.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Revoke invitation"
                    onClick={() => setInvitationToRevoke(inv.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={Plus} title="No pending invitations" description="Invite family members to collaborate." />
          )}
        </div>
      )}

      <InviteMemberDialog weddingId={wedding.id} open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {me && (
        <TransferOwnershipDialog
          weddingId={wedding.id}
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          currentOwnerMemberId={me.id}
          candidates={otherMembers}
        />
      )}

      <ConfirmDialog
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title="Remove member?"
        description={`${memberToRemove?.user_profiles?.full_name ?? 'This member'} will lose access to this wedding.`}
        confirmLabel="Remove"
        danger
        isLoading={removeMember.isPending}
        onConfirm={async () => {
          if (!memberToRemove) return;
          try {
            await removeMember.mutateAsync(memberToRemove.id);
            toast.success('Member removed.');
            setMemberToRemove(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not remove member.');
          }
        }}
      />

      <ConfirmDialog
        open={!!invitationToRevoke}
        onClose={() => setInvitationToRevoke(null)}
        title="Revoke invitation?"
        description="The invite link will stop working."
        confirmLabel="Revoke"
        danger
        isLoading={revokeInvitation.isPending}
        onConfirm={async () => {
          if (!invitationToRevoke) return;
          try {
            await revokeInvitation.mutateAsync(invitationToRevoke);
            toast.success('Invitation revoked.');
            setInvitationToRevoke(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not revoke invitation.');
          }
        }}
      />
    </div>
  );
}
