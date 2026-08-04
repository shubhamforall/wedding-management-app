import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateTimelineEvent, useUpdateTimelineEvent } from './hooks';
import type { TimelineEvent, TimelineEventInput } from './types';

const emptyValues: TimelineEventInput = {
  event_name: '',
  event_date: null,
  event_time: null,
  venue: '',
  responsible_person: '',
  checklist: '',
  status: 'Upcoming',
  notes: '',
};

export function TimelineFormDialog({
  weddingId,
  open,
  onClose,
  timelineEvent,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  timelineEvent: TimelineEvent | null;
}) {
  const { data: eventOptions } = useListOptions(weddingId, 'timeline_event');
  const { data: statusOptions } = useListOptions(weddingId, 'timeline_status');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createTimelineEvent = useCreateTimelineEvent(weddingId);
  const updateTimelineEvent = useUpdateTimelineEvent(weddingId);

  const knownEventNames = useMemo(() => new Set((eventOptions ?? []).map((o) => o.value)), [eventOptions]);
  const [isCustom, setIsCustom] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TimelineEventInput>({ defaultValues: emptyValues });

  const selectedEvent = watch('event_name');

  useEffect(() => {
    if (open) {
      if (timelineEvent) {
        const custom = !knownEventNames.has(timelineEvent.event_name);
        setIsCustom(custom);
        reset({ ...timelineEvent });
      } else {
        setIsCustom(false);
        reset({ ...emptyValues, status: statusOptions?.[0]?.value ?? 'Upcoming' });
      }
    }
  }, [open, timelineEvent, reset, statusOptions, knownEventNames]);

  const isPending = createTimelineEvent.isPending || updateTimelineEvent.isPending;

  const onSubmit = async (values: TimelineEventInput) => {
    const payload: TimelineEventInput = { ...values, event_date: values.event_date || null, event_time: values.event_time || null };
    try {
      if (timelineEvent) {
        await updateTimelineEvent.mutateAsync({ id: timelineEvent.id, input: payload });
        toast.success('Event updated.');
      } else {
        await createTimelineEvent.mutateAsync(payload);
        toast.success('Event added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save event.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={timelineEvent ? 'Edit Event' : 'Add Event'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Event"
          value={isCustom ? 'Custom' : selectedEvent}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'Custom') {
              setIsCustom(true);
              setValue('event_name', '');
            } else {
              setIsCustom(false);
              setValue('event_name', value);
            }
          }}
        >
          <option value="">— Select —</option>
          {(eventOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>

        {isCustom && (
          <Input
            label="Custom Event Name"
            error={errors.event_name?.message}
            {...register('event_name', { required: 'Event name is required' })}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" {...register('event_date')} />
          <Input label="Time" type="time" {...register('event_time')} />
        </div>

        <Input label="Venue" {...register('venue')} />

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

        <Textarea label="Checklist" {...register('checklist')} />
        <Textarea label="Notes" {...register('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {timelineEvent ? 'Save Changes' : 'Add Event'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
