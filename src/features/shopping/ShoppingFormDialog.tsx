import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateShoppingItem, useUpdateShoppingItem } from './hooks';
import type { ShoppingItem, ShoppingItemInput } from './types';

const emptyValues: ShoppingItemInput = {
  item: '',
  category: '',
  responsible_person: '',
  actual_cost: 0,
  status: 'Not Started',
  notes: '',
};

export function ShoppingFormDialog({
  weddingId,
  open,
  onClose,
  shoppingItem,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  shoppingItem: ShoppingItem | null;
}) {
  const { data: categoryOptions } = useListOptions(weddingId, 'shopping_category');
  const { data: statusOptions } = useListOptions(weddingId, 'shopping_status');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createShoppingItem = useCreateShoppingItem(weddingId);
  const updateShoppingItem = useUpdateShoppingItem(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShoppingItemInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      reset(
        shoppingItem
          ? { ...shoppingItem }
          : { ...emptyValues, category: categoryOptions?.[0]?.value ?? '', status: statusOptions?.[0]?.value ?? 'Not Started' }
      );
    }
  }, [open, shoppingItem, reset, categoryOptions, statusOptions]);

  const isPending = createShoppingItem.isPending || updateShoppingItem.isPending;

  const onSubmit = async (values: ShoppingItemInput) => {
    try {
      if (shoppingItem) {
        await updateShoppingItem.mutateAsync({ id: shoppingItem.id, input: values });
        toast.success('Item updated.');
      } else {
        await createShoppingItem.mutateAsync(values);
        toast.success('Item added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save item.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={shoppingItem ? 'Edit Item' : 'Add Item'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Item" error={errors.item?.message} {...register('item', { required: 'Item is required' })} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" {...register('category')}>
            <option value="">— Select —</option>
            {(categoryOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
          <Select label="Responsible Person" {...register('responsible_person')}>
            <option value="">— Select —</option>
            {(familyMemberOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Actual Cost (₹)"
            type="number"
            min={0}
            error={errors.actual_cost?.message}
            {...register('actual_cost', { required: true, min: 0, valueAsNumber: true })}
          />
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
            {shoppingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
