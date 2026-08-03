import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useGuests } from '@/features/guests/hooks';
import { useCreateStayArrangement, useUpdateStayArrangement } from './hooks';
import type { StayArrangement, StayArrangementInput } from './types';

const OTHER_VALUE = '__other__';

const emptyValues: StayArrangementInput = {
  guest_id: null,
  guest_name_freeform: '',
  villa: '',
  address: '',
  responsible_person: '',
  notes: '',
};

export function StayFormDialog({
  weddingId,
  open,
  onClose,
  stay,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  stay: StayArrangement | null;
}) {
  const { data: guests } = useGuests(weddingId);
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createStay = useCreateStayArrangement(weddingId);
  const updateStay = useUpdateStayArrangement(weddingId);
  const [isOther, setIsOther] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StayArrangementInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      if (stay) {
        setIsOther(!stay.guest_id);
        reset({ ...stay });
      } else {
        setIsOther(false);
        reset(emptyValues);
      }
    }
  }, [open, stay, reset]);

  const isPending = createStay.isPending || updateStay.isPending;

  const onSubmit = async (values: StayArrangementInput) => {
    const payload: StayArrangementInput = isOther
      ? { ...values, guest_id: null }
      : { ...values, guest_name_freeform: null };
    try {
      if (stay) {
        await updateStay.mutateAsync({ id: stay.id, input: payload });
        toast.success('Stay arrangement updated.');
      } else {
        await createStay.mutateAsync(payload);
        toast.success('Stay arrangement added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save stay arrangement.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={stay ? 'Edit Stay Arrangement' : 'Add Stay Arrangement'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Guest Family"
          value={isOther ? OTHER_VALUE : stay?.guest_id ?? ''}
          defaultValue={isOther ? OTHER_VALUE : undefined}
          onChange={(e) => {
            const value = e.target.value;
            if (value === OTHER_VALUE) {
              setIsOther(true);
              setValue('guest_id', null);
            } else {
              setIsOther(false);
              setValue('guest_id', value);
            }
          }}
        >
          <option value="">— Select —</option>
          {(guests ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.family_name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other / Not in Guest List</option>
        </Select>

        {isOther && (
          <Input
            label="Guest / Family Name"
            error={errors.guest_name_freeform?.message}
            {...register('guest_name_freeform', { required: 'Name is required' })}
          />
        )}

        <Input label="Villa" placeholder="e.g. Hotel Sunview" {...register('villa')} />
        <Input label="Address" {...register('address')} />

        <Select label="Responsible Person" {...register('responsible_person')}>
          <option value="">— Select —</option>
          {(familyMemberOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>

        <Textarea label="Notes" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {stay ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
