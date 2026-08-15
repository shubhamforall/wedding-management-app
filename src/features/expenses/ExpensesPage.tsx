import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useListOptions } from '@/hooks/useListOptions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { formatCurrency } from '@/lib/format';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { useDeleteExpense, useExpenses, useVendorOptions } from './hooks';
import type { Expense } from './types';

function expenseCode(index: number) {
  return `E${String(index + 1).padStart(3, '0')}`;
}

export function ExpensesPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: expenses, isLoading } = useExpenses(wedding.id);
  const { data: categoryOptions } = useListOptions(wedding.id, 'budget_category');
  const { data: vendorOptions } = useVendorOptions(wedding.id);
  const deleteExpense = useDeleteExpense(wedding.id);

  const vendorNameById = useMemo(() => new Map((vendorOptions ?? []).map((v) => [v.id, v.name])), [vendorOptions]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    if (!expenses) return [];
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const vendorName = e.vendor_id ? vendorNameById.get(e.vendor_id) ?? '' : '';
      const matchesSearch =
        !q ||
        e.description?.toLowerCase().includes(q) ||
        e.paid_by?.toLowerCase().includes(q) ||
        vendorName.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter, vendorNameById]);

  const runningTotal = useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered]);

  const openCreate = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Expense, any>[]>(
    () => [
      {
        id: 'expense_id',
        header: 'Expense ID',
        cell: ({ row }) => <span className="text-text-muted">{expenseCode(expenses?.indexOf(row.original) ?? 0)}</span>,
      },
      { accessorKey: 'expense_date', header: 'Date', cell: ({ getValue }) => dayjs(getValue<string>()).format('DD MMM YYYY') },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => getValue<string>() || '—' },
      {
        id: 'vendor',
        header: 'Vendor',
        cell: ({ row }) => (row.original.vendor_id ? vendorNameById.get(row.original.vendor_id) ?? '—' : '—'),
      },
      { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
      { accessorKey: 'paid_by', header: 'Paid By', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'payment_mode', header: 'Payment Mode', cell: ({ getValue }) => getValue<string>() || '—' },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: Expense } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit expense"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete expense"
                    onClick={() => setExpenseToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<Expense, any>,
          ]
        : []),
    ],
    [expenses, canEdit, vendorNameById]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Expenses</h1>
          <p className="text-sm text-text-muted">{expenses?.length ?? 0} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton
            weddingId={wedding.id}
            role={role}
            lists={[
              { listType: 'budget_category', label: 'Budget Categories' },
              { listType: 'payment_mode', label: 'Payment Mode' },
              { listType: 'expense_status', label: 'Expense Status' },
            ]}
          />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search description, vendor, paid by..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-52">
          <option value="all">All Categories</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      <Card className="mb-4 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-text-muted">Running Total</span>
        <span className="text-lg font-semibold text-text">{formatCurrency(runningTotal)}</span>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={expenses?.length ? 'No expenses match your search' : 'No expenses yet'}
          description={expenses?.length ? 'Try a different search or filter.' : 'Add your first expense to get started.'}
          action={
            canEdit && !expenses?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((expense) => (
              <Card key={expense.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{expense.description || expense.category}</p>
                    <p className="text-xs text-text-muted">
                      {expenseCode(expenses?.indexOf(expense) ?? 0)} · {expense.category} · {dayjs(expense.expense_date).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-text">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {expense.paid_by && <span>Paid by {expense.paid_by}</span>}
                  {expense.payment_mode && <span>{expense.payment_mode}</span>}
                  {expense.vendor_id && <span>{vendorNameById.get(expense.vendor_id) ?? 'Vendor'}</span>}
                </div>
                {canEdit && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(expense)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setExpenseToDelete(expense)}>
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

      <ExpenseFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} expense={editingExpense} />

      <ConfirmDialog
        open={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Delete expense?"
        description={`This expense of ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''} will be removed.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteExpense.isPending}
        onConfirm={async () => {
          if (!expenseToDelete) return;
          try {
            await deleteExpense.mutateAsync(expenseToDelete.id);
            toast.success('Expense deleted.');
            setExpenseToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete expense.');
          }
        }}
      />
    </div>
  );
}
