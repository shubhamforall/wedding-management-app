import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTransferOwnership } from './hooks';
import type { MemberRow } from './types';

export function TransferOwnershipDialog({
  weddingId,
  open,
  onClose,
  currentOwnerMemberId,
  candidates,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  currentOwnerMemberId: string;
  candidates: MemberRow[];
}) {
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? '');
  const transferOwnership = useTransferOwnership(weddingId);

  const onConfirm = async () => {
    if (!selectedId) return;
    try {
      await transferOwnership.mutateAsync({ currentOwnerMemberId, newOwnerMemberId: selectedId });
      toast.success('Ownership transferred.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not transfer ownership.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Transfer Ownership"
      description="You'll become a Member. The person you choose becomes the new Owner. This can't be undone by you alone."
    >
      {candidates.length === 0 ? (
        <p className="text-sm text-text-muted">Invite another member first — there's no one to transfer ownership to yet.</p>
      ) : (
        <div className="space-y-4">
          <Select label="New owner" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user_profiles?.full_name ?? 'Unnamed member'}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm} isLoading={transferOwnership.isPending}>
              Transfer Ownership
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
