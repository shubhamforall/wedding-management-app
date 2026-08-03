import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useListOptions } from '@/hooks/useListOptions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GuestFormDialog } from './GuestFormDialog';
import { useDeleteGuest, useGuests } from './hooks';
import type { Guest } from './types';

function familyCode(index: number) {
  return `F${String(index + 1).padStart(3, '0')}`;
}

export function GuestsPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: guests, isLoading } = useGuests(wedding.id);
  const { data: invitationStatusOptions } = useListOptions(wedding.id, 'invitation_status');
  const deleteGuest = useDeleteGuest(wedding.id);

  const [search, setSearch] = useState('');
  const [invitationFilter, setInvitationFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesSearch =
        !q ||
        g.family_name.toLowerCase().includes(q) ||
        g.village_city?.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.whatsapp?.includes(q);
      const matchesInvitation = invitationFilter === 'all' || g.invitation_status === invitationFilter;
      return matchesSearch && matchesInvitation;
    });
  }, [guests, search, invitationFilter]);

  const openCreate = () => {
    setEditingGuest(null);
    setFormOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Guest, any>[]>(
    () => [
      {
        id: 'family_id',
        header: 'Family ID',
        cell: ({ row }) => <span className="text-text-muted">{familyCode(guests?.indexOf(row.original) ?? 0)}</span>,
      },
      { accessorKey: 'family_name', header: 'Family Name' },
      { accessorKey: 'village_city', header: 'Village/City', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'total_members', header: 'Members' },
      {
        accessorKey: 'invitation_status',
        header: 'Invitation',
        cell: ({ getValue }) => (
          <Badge tone={getValue<string>() === 'Yes' ? 'success' : 'warning'}>{getValue<string>()}</Badge>
        ),
      },
      {
        id: 'attending',
        header: 'Attending',
        cell: ({ row }) => {
          const g = row.original;
          const events = [
            g.attending_engagement && 'Engagement',
            g.attending_haldi && 'Haldi',
            g.attending_wedding && 'Wedding',
          ].filter(Boolean);
          return <span className="text-text-muted">{events.length ? events.join(', ') : '—'}</span>;
        },
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: Guest } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit family"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete family"
                    onClick={() => setGuestToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<Guest, any>,
          ]
        : []),
    ],
    [guests, canEdit]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Guests</h1>
          <p className="text-sm text-text-muted">{guests?.length ?? 0} families</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Family
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, village, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={invitationFilter} onChange={(e) => setInvitationFilter(e.target.value)} className="sm:w-52">
          <option value="all">All Invitation Statuses</option>
          {(invitationStatusOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={guests?.length ? 'No families match your search' : 'No families yet'}
          description={guests?.length ? 'Try a different search or filter.' : 'Add your first family to get started.'}
          action={
            canEdit && !guests?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Family
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{guest.family_name}</p>
                    <p className="text-xs text-text-muted">
                      {familyCode(guests?.indexOf(guest) ?? 0)}
                      {guest.village_city && ` · ${guest.village_city}`}
                    </p>
                  </div>
                  <Badge tone={guest.invitation_status === 'Yes' ? 'success' : 'warning'}>{guest.invitation_status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span>{guest.total_members} members</span>
                  {guest.phone && <span>{guest.phone}</span>}
                </div>
                {(guest.attending_engagement || guest.attending_haldi || guest.attending_wedding) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {guest.attending_engagement && <Badge tone="info">Engagement</Badge>}
                    {guest.attending_haldi && <Badge tone="info">Haldi</Badge>}
                    {guest.attending_wedding && <Badge tone="info">Wedding</Badge>}
                  </div>
                )}
                {canEdit && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(guest)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setGuestToDelete(guest)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} pageSize={25} />
          </div>
        </>
      )}

      <GuestFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} guest={editingGuest} />

      <ConfirmDialog
        open={!!guestToDelete}
        onClose={() => setGuestToDelete(null)}
        title="Remove family?"
        description={`${guestToDelete?.family_name ?? 'This family'} will be removed from the guest list.`}
        confirmLabel="Remove"
        danger
        isLoading={deleteGuest.isPending}
        onConfirm={async () => {
          if (!guestToDelete) return;
          try {
            await deleteGuest.mutateAsync(guestToDelete.id);
            toast.success('Family removed.');
            setGuestToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not remove family.');
          }
        }}
      />
    </div>
  );
}
