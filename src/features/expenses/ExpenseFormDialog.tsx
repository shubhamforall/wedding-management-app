import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateExpense, useUpdateExpense, useVendorOptions } from './hooks';
import type { Expense, ExpenseInput } from './types';

const emptyValues: ExpenseInput = {
  expense_date: dayjs().format('YYYY-MM-DD'),
  category: '',
  description: '',
  vendor_id: null,
  amount: 0,
  paid_by: '',
  payment_mode: '',
  notes: '',
};

export function ExpenseFormDialog({
  weddingId,
  open,
  onClose,
  expense,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}) {
  const { data: categoryOptions } = useListOptions(weddingId, 'budget_category');
  const { data: paymentModeOptions } = useListOptions(weddingId, 'payment_mode');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const { data: vendorOptions } = useVendorOptions(weddingId);
  const createExpense = useCreateExpense(weddingId);
  const updateExpense = useUpdateExpense(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      reset(
        expense
          ? { ...expense, expense_date: dayjs(expense.expense_date).format('YYYY-MM-DD') }
          : { ...emptyValues, category: categoryOptions?.[0]?.value ?? '' }
      );
    }
  }, [open, expense, reset, categoryOptions]);

  const isPending = createExpense.isPending || updateExpense.isPending;

  const onSubmit = async (values: ExpenseInput) => {
    const payload: ExpenseInput = { ...values, vendor_id: values.vendor_id || null };
    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, input: payload });
        toast.success('Expense updated.');
      } else {
        await createExpense.mutateAsync(payload);
        toast.success('Expense added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save expense.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date', { required: 'Date is required' })}
          />
          <Input
            label="Amount (₹)"
            type="number"
            min={0}
            error={errors.amount?.message}
            {...register('amount', { required: true, min: 0, valueAsNumber: true })}
          />
        </div>

        <Select label="Category" {...register('category', { required: true })}>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>

        <Input label="Description" {...register('description')} />

        <Select label="Vendor" {...register('vendor_id')}>
          <option value="">— None —</option>
          {(vendorOptions ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Paid By" {...register('paid_by')}>
            <option value="">— Select —</option>
            {(familyMemberOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
          <Select label="Payment Mode" {...register('payment_mode')}>
            <option value="">— Select —</option>
            {(paymentModeOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
        </div>

        <Textarea label="Notes" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
