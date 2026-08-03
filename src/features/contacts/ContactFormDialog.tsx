import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useCreateManualContact, useUpdateManualContact } from './hooks';
import type { ContactRow, ManualContactInput } from './types';

const emptyValues: ManualContactInput = { name: '', type: '', phone: '', alternate_phone: '', notes: '' };

export function ContactFormDialog({
  weddingId,
  open,
  onClose,
  contact,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  contact: ContactRow | null;
}) {
  const createContact = useCreateManualContact(weddingId);
  const updateContact = useUpdateManualContact(weddingId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualContactInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) reset(contact ? { ...contact } : emptyValues);
  }, [open, contact, reset]);

  const isPending = createContact.isPending || updateContact.isPending;

  const onSubmit = async (values: ManualContactInput) => {
    try {
      if (contact) {
        await updateContact.mutateAsync({ id: contact.id, input: values });
        toast.success('Contact updated.');
      } else {
        await createContact.mutateAsync(values);
        toast.success('Contact added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save contact.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Type" placeholder="e.g. Priest, Makeup Artist" {...register('type')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('phone')} />
          <Input label="Alternate Phone" {...register('alternate_phone')} />
        </div>
        <Textarea label="Notes" {...register('notes')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {contact ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
