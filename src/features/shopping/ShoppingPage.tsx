import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format';
import { ShoppingFormDialog } from './ShoppingFormDialog';
import { useDeleteShoppingItem, useShoppingItems } from './hooks';
import type { ShoppingItem } from './types';

function statusTone(status: string) {
  if (status === 'Completed') return 'success' as const;
  if (status === 'Alteration Pending') return 'warning' as const;
  if (status === 'Not Started') return 'neutral' as const;
  return 'info' as const;
}

export function ShoppingPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: items, isLoading } = useShoppingItems(wedding.id);
  const { data: categoryOptions } = useListOptions(wedding.id, 'shopping_category');
  const { data: statusOptions } = useListOptions(wedding.id, 'shopping_status');
  const deleteShoppingItem = useDeleteShoppingItem(wedding.id);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  const stats = useMemo(() => {
    if (!items) return { progress: 0, remaining: 0, totalCost: 0 };
    const completed = items.filter((i) => i.status === 'Completed').length;
    return {
      progress: items.length ? Math.round((completed / items.length) * 100) : 0,
      remaining: items.length - completed,
      totalCost: items.reduce((sum, i) => sum + i.actual_cost, 0),
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesSearch = !q || i.item.toLowerCase().includes(q) || i.responsible_person?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<ShoppingItem, any>[]>(
    () => [
      { accessorKey: 'item', header: 'Item' },
      { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'responsible_person', header: 'Responsible Person', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'actual_cost', header: 'Actual Cost', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <Badge tone={statusTone(getValue<string>())}>{getValue<string>()}</Badge>,
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: ShoppingItem } }) => (
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
            } satisfies ColumnDef<ShoppingItem, any>,
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
          <h1 className="text-lg font-semibold text-text">Shopping</h1>
          <p className="text-sm text-text-muted">{items?.length ?? 0} items</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Shopping Progress</p>
          <p className="mt-1 text-lg font-semibold text-text">{stats.progress}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Remaining Items</p>
          <p className="mt-1 text-lg font-semibold text-text">{stats.remaining}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Total Cost</p>
          <p className="mt-1 text-lg font-semibold text-text">{formatCurrency(stats.totalCost, true)}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search item, responsible person..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-44">
          <option value="all">All Categories</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
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
          icon={ShoppingBag}
          title={items?.length ? 'No items match your search' : 'No shopping items yet'}
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
            {filtered.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{item.item}</p>
                    <p className="text-xs text-text-muted">{item.category || 'Uncategorized'}</p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span>{formatCurrency(item.actual_cost)}</span>
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
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} pageSize={25} />
          </div>
        </>
      )}

      <ShoppingFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} shoppingItem={editingItem} />

      <ConfirmDialog
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete item?"
        description={`${itemToDelete?.item ?? 'This item'} will be removed from the shopping list.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteShoppingItem.isPending}
        onConfirm={async () => {
          if (!itemToDelete) return;
          try {
            await deleteShoppingItem.mutateAsync(itemToDelete.id);
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
