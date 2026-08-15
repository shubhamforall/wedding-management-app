import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { cn } from '@/lib/cn';
import { InventoryFormDialog } from './InventoryFormDialog';
import { useDeleteInventoryItem, useInventoryItems } from './hooks';
import { shortfall, type InventoryItem } from './types';

export function InventoryPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: items, isLoading } = useInventoryItems(wedding.id);
  const { data: statusOptions } = useListOptions(wedding.id, 'inventory_status');
  const deleteInventoryItem = useDeleteInventoryItem(wedding.id);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const shortItemsCount = useMemo(() => (items ?? []).filter((i) => shortfall(i) > 0).length, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesSearch = !q || i.item.toLowerCase().includes(q) || i.responsible_person?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<InventoryItem, any>[]>(
    () => [
      { accessorKey: 'item', header: 'Item' },
      { accessorKey: 'required_qty', header: 'Required Qty', cell: ({ getValue }) => getValue<number>() ?? '—' },
      { accessorKey: 'available_qty', header: 'Available Qty', cell: ({ getValue }) => getValue<number>() ?? '—' },
      {
        id: 'shortfall',
        header: 'Shortfall',
        cell: ({ row }) => {
          const s = shortfall(row.original);
          return <span className={cn(s > 0 && 'font-medium text-danger')}>{s}</span>;
        },
      },
      { accessorKey: 'responsible_person', header: 'Responsible Person', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => getValue<string>() || '—' },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: InventoryItem } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit item"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete item"
                    onClick={() => setItemToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<InventoryItem, any>,
          ]
        : []),
    ],
    [canEdit]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Inventory</h1>
          <p className="text-sm text-text-muted">
            {items?.length ?? 0} items{shortItemsCount > 0 && <span className="text-danger"> · {shortItemsCount} short</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton weddingId={wedding.id} role={role} lists={[{ listType: 'inventory_status', label: 'Inventory Status' }]} />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search item, responsible person..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">All Statuses</option>
          {(statusOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={items?.length ? 'No items match your search' : 'No inventory items yet'}
          description={items?.length ? 'Try a different search or filter.' : 'Add your first item to get started.'}
          action={
            canEdit && !items?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((item) => {
              const s = shortfall(item);
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{item.item}</p>
                      <p className="text-xs text-text-muted">{item.status || 'No status'}</p>
                    </div>
                    {s > 0 && <Badge tone="danger">Short {s}</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>Required: {item.required_qty ?? '—'}</span>
                    <span>Available: {item.available_qty ?? '—'}</span>
                    {item.responsible_person && <span>{item.responsible_person}</span>}
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} pageSize={25} />
          </div>
        </>
      )}

      <InventoryFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} inventoryItem={editingItem} />

      <ConfirmDialog
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete item?"
        description={`${itemToDelete?.item ?? 'This item'} will be removed from inventory.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteInventoryItem.isPending}
        onConfirm={async () => {
          if (!itemToDelete) return;
          try {
            await deleteInventoryItem.mutateAsync(itemToDelete.id);
            toast.success('Item deleted.');
            setItemToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete item.');
          }
        }}
      />
    </div>
  );
}
