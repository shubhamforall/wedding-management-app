import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Store, Phone } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format';
import { VendorFormDialog } from './VendorFormDialog';
import { useDeleteVendor, useVendors } from './hooks';
import { remainingAmount, vendorStatus, type Vendor } from './types';

export function VendorsPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: vendors, isLoading } = useVendors(wedding.id);
  const { data: categoryOptions } = useListOptions(wedding.id, 'vendor_category');
  const deleteVendor = useDeleteVendor(wedding.id);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const filtered = useMemo(() => {
    if (!vendors) return [];
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesSearch = !q || v.name.toLowerCase().includes(q) || v.phone?.includes(q) || v.handled_by?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, search, categoryFilter]);

  const openCreate = () => {
    setEditingVendor(null);
    setFormOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Vendor, any>[]>(
    () => [
      { accessorKey: 'name', header: 'Vendor Name' },
      { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'total_amount', header: 'Total Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
      { accessorKey: 'advance_paid', header: 'Advance Paid', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
      {
        id: 'remaining',
        header: 'Remaining',
        cell: ({ row }) => formatCurrency(remainingAmount(row.original)),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = vendorStatus(row.original);
          return <Badge tone={status === 'Fully Paid' ? 'success' : 'warning'}>{status}</Badge>;
        },
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: Vendor } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit vendor"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete vendor"
                    onClick={() => setVendorToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<Vendor, any>,
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
          <h1 className="text-lg font-semibold text-text">Vendors</h1>
          <p className="text-sm text-text-muted">{vendors?.length ?? 0} vendors</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton weddingId={wedding.id} role={role} lists={[{ listType: 'vendor_category', label: 'Vendor Categories' }]} />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by name, phone, handled by..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-52">
          <option value="all">All Categories</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title={vendors?.length ? 'No vendors match your search' : 'No vendors yet'}
          description={vendors?.length ? 'Try a different search or filter.' : 'Add your first vendor to get started.'}
          action={
            canEdit && !vendors?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((vendor) => {
              const remaining = remainingAmount(vendor);
              const status = vendorStatus(vendor);
              return (
                <Card key={vendor.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{vendor.name}</p>
                      <p className="text-xs text-text-muted">{vendor.category || 'Uncategorized'}</p>
                    </div>
                    <Badge tone={status === 'Fully Paid' ? 'success' : 'warning'}>{status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-text-muted">
                    <span>Total: {formatCurrency(vendor.total_amount)}</span>
                    <span>Advance: {formatCurrency(vendor.advance_paid)}</span>
                    <span className={remaining > 0 ? 'text-warning' : 'text-success'}>Remaining: {formatCurrency(remaining)}</span>
                    {vendor.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {vendor.phone}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(vendor)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setVendorToDelete(vendor)}>
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

      <VendorFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} vendor={editingVendor} />

      <ConfirmDialog
        open={!!vendorToDelete}
        onClose={() => setVendorToDelete(null)}
        title="Delete vendor?"
        description={`${vendorToDelete?.name ?? 'This vendor'} will be removed. Expenses already linked to it will keep their record but lose the vendor reference.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteVendor.isPending}
        onConfirm={async () => {
          if (!vendorToDelete) return;
          try {
            await deleteVendor.mutateAsync(vendorToDelete.id);
            toast.success('Vendor deleted.');
            setVendorToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete vendor.');
          }
        }}
      />
    </div>
  );
}
