import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import { useBudgetSummary, useUpdateEstimatedAmount } from './hooks';
import { BudgetChart } from './BudgetChart';
import type { BudgetSummaryRow } from './types';

function statusTone(status: BudgetSummaryRow['status']) {
  if (status === 'Over Budget') return 'danger' as const;
  if (status === 'Not Set') return 'neutral' as const;
  return 'success' as const;
}

function EstimatedInput({ row, canEdit, onSave }: { row: BudgetSummaryRow; canEdit: boolean; onSave: (amount: number) => void }) {
  const [value, setValue] = useState(String(row.estimated_amount));

  if (!canEdit) return <span className="text-text">{formatCurrency(row.estimated_amount)}</span>;

  return (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const num = Number(value);
        if (!Number.isNaN(num) && num !== row.estimated_amount) onSave(num);
      }}
      className="h-9 w-32"
    />
  );
}

export function BudgetPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: rows, isLoading } = useBudgetSummary(wedding.id);
  const updateEstimatedAmount = useUpdateEstimatedAmount(wedding.id);

  const totals = useMemo(() => {
    if (!rows) return null;
    return rows.reduce(
      (acc, r) => ({
        estimated: acc.estimated + r.estimated_amount,
        actual: acc.actual + r.actual_expense,
      }),
      { estimated: 0, actual: 0 }
    );
  }, [rows]);

  if (isLoading || !rows) return <FullPageSpinner />;

  const save = async (id: string, amount: number) => {
    try {
      await updateEstimatedAmount.mutateAsync({ id, amount });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update estimated budget.');
    }
  };

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Budget</h1>
          <p className="text-sm text-text-muted">Actual Expense is pulled automatically from Expenses.</p>
        </div>
      </div>

      {totals && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-text-muted">Total Estimated</p>
            <p className="mt-1 text-lg font-semibold text-text">{formatCurrency(totals.estimated, true)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-muted">Total Actual</p>
            <p className="mt-1 text-lg font-semibold text-text">{formatCurrency(totals.actual, true)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-text-muted">Difference</p>
            <p className={`mt-1 text-lg font-semibold ${totals.estimated - totals.actual < 0 ? 'text-danger' : 'text-text'}`}>
              {formatCurrency(totals.estimated - totals.actual, true)}
            </p>
          </Card>
        </div>
      )}

      <Card className="mb-6 overflow-x-auto p-4">
        <BudgetChart rows={rows} />
      </Card>

      <div className="space-y-2 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-text">{row.category}</p>
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-text-muted">Estimated</span>
              <EstimatedInput row={row} canEdit={canEdit} onSave={(amount) => save(row.id, amount)} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Actual</span>
              <span className="text-text">{formatCurrency(row.actual_expense)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-text-muted">Difference</span>
              <span className={row.difference < 0 ? 'text-danger' : 'text-text'}>{formatCurrency(row.difference)}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Category</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Estimated Budget</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Actual Expense</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Difference</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">% Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border-subtle hover:bg-bg-subtle">
                <td className="px-4 py-2.5 text-text">{row.category}</td>
                <td className="px-4 py-2.5">
                  <EstimatedInput row={row} canEdit={canEdit} onSave={(amount) => save(row.id, amount)} />
                </td>
                <td className="px-4 py-2.5 text-text">{formatCurrency(row.actual_expense)}</td>
                <td className={`px-4 py-2.5 ${row.difference < 0 ? 'text-danger' : 'text-text'}`}>{formatCurrency(row.difference)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text">{row.pct_used}%</td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="border-t-2 border-border bg-bg-subtle font-medium">
              <tr>
                <td className="px-4 py-3 text-text">Total</td>
                <td className="px-4 py-3 text-text">{formatCurrency(totals.estimated)}</td>
                <td className="px-4 py-3 text-text">{formatCurrency(totals.actual)}</td>
                <td className={`px-4 py-3 ${totals.estimated - totals.actual < 0 ? 'text-danger' : 'text-text'}`}>
                  {formatCurrency(totals.estimated - totals.actual)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-text-muted">
          <Wallet className="h-8 w-8" />
          <p>No budget categories yet.</p>
        </div>
      )}
    </div>
  );
}
