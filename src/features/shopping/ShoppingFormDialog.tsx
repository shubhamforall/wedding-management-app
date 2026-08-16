import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { DocumentUploadZone } from './DocumentUploadZone';
import type { ExtractedShoppingData } from './utils/shoppingParser';
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

  const [hasAutofilled, setHasAutofilled] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShoppingItemInput>({ defaultValues: emptyValues });

  const categories = categoryOptions?.map((o) => o.value) ?? [];
  const familyMembers = familyMemberOptions?.map((o) => o.value) ?? [];

  useEffect(() => {
    if (open) {
      setHasAutofilled(false);
      reset(
        shoppingItem
          ? { ...shoppingItem }
          : { ...emptyValues, category: categoryOptions?.[0]?.value ?? '', status: statusOptions?.[0]?.value ?? 'Not Started' }
      );
    }
  }, [open, shoppingItem, reset, categoryOptions, statusOptions]);

  const handleOcrExtracted = (data: ExtractedShoppingData) => {
    if (data.primary.item) {
      setValue('item', data.primary.item, { shouldValidate: true, shouldDirty: true });
    }
    if (data.primary.actual_cost !== undefined) {
      setValue('actual_cost', data.primary.actual_cost, { shouldValidate: true, shouldDirty: true });
    }
    if (data.primary.category) {
      setValue('category', data.primary.category, { shouldValidate: true, shouldDirty: true });
    }
    if (data.primary.responsible_person) {
      setValue('responsible_person', data.primary.responsible_person, { shouldValidate: true, shouldDirty: true });
    }
    if (data.primary.status) {
      setValue('status', data.primary.status, { shouldValidate: true, shouldDirty: true });
    }
    if (data.primary.notes) {
      setValue('notes', data.primary.notes, { shouldValidate: true, shouldDirty: true });
    }
    setHasAutofilled(true);
  };

  const handleItemSelect = (item: { item: string; actual_cost: number; category: string; notes?: string }) => {
    setValue('item', item.item, { shouldValidate: true, shouldDirty: true });
    setValue('actual_cost', item.actual_cost, { shouldValidate: true, shouldDirty: true });
    if (item.category) {
      setValue('category', item.category, { shouldValidate: true, shouldDirty: true });
    }
  };

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
    <Dialog open={open} onClose={onClose} title={shoppingItem ? 'Edit Item' : 'Add Shopping Item'}>
      {/* OCR Auto-Fill Document & Receipt Zone */}
      <DocumentUploadZone
        availableCategories={categories}
        availableFamilyMembers={familyMembers}
        onDataExtracted={handleOcrExtracted}
        onItemSelect={handleItemSelect}
      />

      {hasAutofilled && (
        <div className="mb-3 flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Fields populated from your document. You can review, edit, and save below.</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Item Name"
          placeholder="e.g. Bridal Lehenga, Royal Sherwani, Gold Ring"
          error={errors.item?.message}
          {...register('item', { required: 'Item name is required' })}
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

        <Textarea
          label="Notes / Store & Bill Details"
          placeholder="Vendor/store name, invoice number, alteration notes, or item breakdown"
          rows={3}
          {...register('notes')}
        />

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

