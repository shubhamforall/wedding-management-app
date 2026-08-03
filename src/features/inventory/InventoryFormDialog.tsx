import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateInventoryItem, useUpdateInventoryItem } from './hooks';
import type { InventoryItem, InventoryItemInput } from './types';

const emptyValues: InventoryItemInput = {
  item: '',
  required_qty: null,
  available_qty: null,
  responsible_person: '',
  status: 'Not Ordered',
  notes: '',
};

export function InventoryFormDialog({
  weddingId,
  open,
  onClose,
  inventoryItem,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  inventoryItem: InventoryItem | null;
}) {
  const { data: statusOptions } = useListOptions(weddingId, 'inventory_status');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createInventoryItem = useCreateInventoryItem(weddingId);
  const updateInventoryItem = useUpdateInventoryItem(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      reset(inventoryItem ? { ...inventoryItem } : { ...emptyValues, status: statusOptions?.[0]?.value ?? 'Not Ordered' });
    }
  }, [open, inventoryItem, reset, statusOptions]);

  const isPending = createInventoryItem.isPending || updateInventoryItem.isPending;

  const onSubmit = async (values: InventoryItemInput) => {
    try {
      if (inventoryItem) {
        await updateInventoryItem.mutateAsync({ id: inventoryItem.id, input: values });
        toast.success('Item updated.');
      } else {
        await createInventoryItem.mutateAsync(values);
        toast.success('Item added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save item.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={inventoryItem ? 'Edit Item' : 'Add Item'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Item"
          placeholder="e.g. Invitation Cards, Return Gifts, Flowers..."
          error={errors.item?.message}
          {...register('item', { required: 'Item is required' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Required Qty"
            type="number"
            min={0}
            {...register('required_qty', { valueAsNumber: true, setValueAs: (v) => (v === '' ? null : Number(v)) })}
          />
          <Input
            label="Available Qty"
            type="number"
            min={0}
            {...register('available_qty', { valueAsNumber: true, setValueAs: (v) => (v === '' ? null : Number(v)) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Responsible Person" {...register('responsible_person')}>
            <option value="">— Select —</option>
            {(familyMemberOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
          <Select label="Status" {...register('status')}>
            {(statusOptions ?? []).map((opt) => (
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
            {inventoryItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
