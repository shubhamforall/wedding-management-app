import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateGuest, useUpdateGuest } from './hooks';
import type { Guest, GuestInput } from './types';

const emptyValues: GuestInput = {
  family_name: '',
  village_city: '',
  phone: '',
  whatsapp: '',
  total_members: 1,
  invitation_status: 'No',
  attending_engagement: false,
  attending_haldi: false,
  attending_wedding: false,
  notes: '',
};

export function GuestFormDialog({
  weddingId,
  open,
  onClose,
  guest,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
}) {
  const { data: invitationStatusOptions } = useListOptions(weddingId, 'invitation_status');
  const createGuest = useCreateGuest(weddingId);
  const updateGuest = useUpdateGuest(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) reset(guest ? { ...guest } : emptyValues);
  }, [open, guest, reset]);

  const isPending = createGuest.isPending || updateGuest.isPending;

  const onSubmit = async (values: GuestInput) => {
    try {
      if (guest) {
        await updateGuest.mutateAsync({ id: guest.id, input: values });
        toast.success('Family updated.');
      } else {
        await createGuest.mutateAsync(values);
        toast.success('Family added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save family.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={guest ? 'Edit Family' : 'Add Family'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Family Name"
          error={errors.family_name?.message}
          {...register('family_name', { required: 'Family name is required' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Village/City" {...register('village_city')} />
          <Input
            label="Total Members"
            type="number"
            min={1}
            error={errors.total_members?.message}
            {...register('total_members', { required: true, min: 1, valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone Number" {...register('phone')} />
          <Input label="WhatsApp Number" {...register('whatsapp')} />
        </div>

        <Select label="Invitation Status" {...register('invitation_status')}>
          {(invitationStatusOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>

        <div>
          <span className="mb-2 block text-sm font-medium text-text">Attending</span>
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Engagement" {...register('attending_engagement')} />
            <Checkbox label="Haldi" {...register('attending_haldi')} />
            <Checkbox label="Wedding" {...register('attending_wedding')} />
          </div>
        </div>

        <Textarea label="Notes" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {guest ? 'Save Changes' : 'Add Family'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
