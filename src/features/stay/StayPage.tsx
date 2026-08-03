import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useGuests } from '@/features/guests/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StayFormDialog } from './StayFormDialog';
import { useDeleteStayArrangement, useStayArrangements } from './hooks';
import { stayGuestLabel, type StayArrangement } from './types';

export function StayPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: stays, isLoading } = useStayArrangements(wedding.id);
  const { data: guests } = useGuests(wedding.id);
  const deleteStay = useDeleteStayArrangement(wedding.id);

  const guestNameById = useMemo(() => new Map((guests ?? []).map((g) => [g.id, g.family_name])), [guests]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<StayArrangement | null>(null);
  const [stayToDelete, setStayToDelete] = useState<StayArrangement | null>(null);

  const openCreate = () => {
    setEditingStay(null);
    setFormOpen(true);
  };

  const openEdit = (stay: StayArrangement) => {
    setEditingStay(stay);
    setFormOpen(true);
  };

  const guestLabel = (row: StayArrangement) => stayGuestLabel(row, row.guest_id ? guestNameById.get(row.guest_id) : undefined);

  const columns = useMemo<ColumnDef<StayArrangement, any>[]>(
    () => [
      { id: 'guest', header: 'Guest Family', cell: ({ row }) => guestLabel(row.original) },
      { accessorKey: 'villa', header: 'Villa', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'address', header: 'Address', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'responsible_person', header: 'Responsible Person', cell: ({ getValue }) => getValue<string>() || '—' },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: StayArrangement } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit stay arrangement"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete stay arrangement"
                    onClick={() => setStayToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<StayArrangement, any>,
          ]
        : []),
    ],
    [canEdit, guestNameById]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Stay Arrangement</h1>
          <p className="text-sm text-text-muted">{stays?.length ?? 0} records</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Total Families (Guest List)</p>
          <p className="mt-1 text-lg font-semibold text-text">{guests?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Stay Records Added</p>
          <p className="mt-1 text-lg font-semibold text-text">{stays?.length ?? 0}</p>
        </Card>
      </div>

      {!stays || stays.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No stay arrangements yet"
          description="Add hotel/villa details for guests who need accommodation."
          action={
            canEdit ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {stays.map((stay) => (
              <Card key={stay.id} className="p-4">
                <p className="text-sm font-medium text-text">{guestLabel(stay)}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {stay.villa && <span>{stay.villa}</span>}
                  {stay.responsible_person && <span>{stay.responsible_person}</span>}
                </div>
                {stay.address && <p className="mt-1 text-xs text-text-muted">{stay.address}</p>}
                {canEdit && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(stay)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setStayToDelete(stay)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={stays} pageSize={25} />
          </div>
        </>
      )}

      <StayFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} stay={editingStay} />

      <ConfirmDialog
        open={!!stayToDelete}
        onClose={() => setStayToDelete(null)}
        title="Delete stay arrangement?"
        description="This record will be removed."
        confirmLabel="Delete"
        danger
        isLoading={deleteStay.isPending}
        onConfirm={async () => {
          if (!stayToDelete) return;
          try {
            await deleteStay.mutateAsync(stayToDelete.id);
            toast.success('Stay arrangement deleted.');
            setStayToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete stay arrangement.');
          }
        }}
      />
    </div>
  );
}
