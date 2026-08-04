import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { formatCurrency } from '@/lib/format';
import { useCreateVendor, useUpdateVendor } from './hooks';
import type { Vendor, VendorInput } from './types';

const emptyValues: VendorInput = {
  name: '',
  category: '',
  handled_by: '',
  phone: '',
  alternate_phone: '',
  address: '',
  total_amount: 0,
  advance_paid: 0,
  notes: '',
};

export function VendorFormDialog({
  weddingId,
  open,
  onClose,
  vendor,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}) {
  const { data: categoryOptions } = useListOptions(weddingId, 'vendor_category');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createVendor = useCreateVendor(weddingId);
  const updateVendor = useUpdateVendor(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VendorInput>({ defaultValues: emptyValues });

  const totalAmount = useWatch({ control, name: 'total_amount' });
  const advancePaid = useWatch({ control, name: 'advance_paid' });
  const remaining = (Number(totalAmount) || 0) - (Number(advancePaid) || 0);

  useEffect(() => {
    if (open) reset(vendor ? { ...vendor } : emptyValues);
  }, [open, vendor, reset]);

  const isPending = createVendor.isPending || updateVendor.isPending;

  const onSubmit = async (values: VendorInput) => {
    try {
      if (vendor) {
        await updateVendor.mutateAsync({ id: vendor.id, input: values });
        toast.success('Vendor updated.');
      } else {
        await createVendor.mutateAsync(values);
        toast.success('Vendor added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save vendor.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={vendor ? 'Edit Vendor' : 'Add Vendor'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Vendor Name"
          error={errors.name?.message}
          {...register('name', { required: 'Vendor name is required' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" {...register('category')}>
            <option value="">— Select —</option>
            {(categoryOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
          <Select label="Handled By" {...register('handled_by')}>
            <option value="">— Select —</option>
            {(familyMemberOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('phone')} />
          <Input label="Alternate Phone" {...register('alternate_phone')} />
        </div>

        <Input label="Address" {...register('address')} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Amount (₹)"
            type="number"
            min={0}
            error={errors.total_amount?.message}
            {...register('total_amount', { required: true, min: 0, valueAsNumber: true })}
          />
          <Input
            label="Advance Paid (₹)"
            type="number"
            min={0}
            error={errors.advance_paid?.message}
            {...register('advance_paid', { required: true, min: 0, valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-bg-subtle px-3.5 py-2.5 text-sm">
          <span className="text-text-muted">Remaining Amount</span>
          <span className={remaining > 0 ? 'font-medium text-warning' : 'font-medium text-success'}>
            {formatCurrency(remaining)}
          </span>
        </div>

        <Textarea label="Notes" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {vendor ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
