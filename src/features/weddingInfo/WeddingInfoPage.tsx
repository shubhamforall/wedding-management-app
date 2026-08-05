import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, IdCard } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import {
  useCreateEmergencyContact,
  useCreateImportantNumber,
  useDeleteEmergencyContact,
  useDeleteImportantNumber,
  useEmergencyContacts,
  useImportantNumbers,
  useUpdateWeddingInfo,
} from './hooks';
import type { EmergencyContactInput, ImportantNumberInput, WeddingInfoInput } from './types';

function CoreDetailsForm({ weddingId, canEdit }: { weddingId: string; canEdit: boolean }) {
  const { wedding } = useCurrentWedding();
  const updateWeddingInfo = useUpdateWeddingInfo(weddingId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<WeddingInfoInput>({
    defaultValues: {
      bride_name: wedding.bride_name,
      groom_name: wedding.groom_name,
      wedding_date: wedding.wedding_date ?? '',
      reception_date: wedding.reception_date ?? '',
      venue: wedding.venue ?? '',
      address: wedding.address ?? '',
    },
  });

  const onSubmit = async (values: WeddingInfoInput) => {
    // Postgres `date` columns reject '' (only accept a real date or null) —
    // an empty HTML date input sends '' when cleared, so normalize here.
    const payload: WeddingInfoInput = {
      ...values,
      wedding_date: values.wedding_date || null,
      reception_date: values.reception_date || null,
    };
    try {
      await updateWeddingInfo.mutateAsync(payload);
      toast.success('Wedding info updated.');
      reset(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update wedding info.';
      toast.error(message);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-text">Core Details</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Bride Name" disabled={!canEdit} {...register('bride_name', { required: true })} />
          <Input label="Groom Name" disabled={!canEdit} {...register('groom_name', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Wedding Date" type="date" disabled={!canEdit} {...register('wedding_date')} />
          <Input label="Reception Date" type="date" disabled={!canEdit} {...register('reception_date')} />
        </div>
        <Input label="Venue" disabled={!canEdit} {...register('venue')} />
        <Textarea label="Address" disabled={!canEdit} {...register('address')} />
        {canEdit && (
          <Button type="submit" size="sm" isLoading={updateWeddingInfo.isPending} disabled={!isDirty}>
            Save Changes
          </Button>
        )}
      </form>
    </Card>
  );
}

function EmergencyContactsSection({ weddingId, canEdit }: { weddingId: string; canEdit: boolean }) {
  const { data: contacts, isLoading } = useEmergencyContacts(weddingId);
  const createContact = useCreateEmergencyContact(weddingId);
  const deleteContact = useDeleteEmergencyContact(weddingId);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<EmergencyContactInput>({
    defaultValues: { name: '', relation: '', phone: '', notes: '' },
  });

  const onSubmit = async (values: EmergencyContactInput) => {
    try {
      await createContact.mutateAsync(values);
      toast.success('Contact added.');
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add contact.');
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Emergency Contacts</h2>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>
      {isLoading ? (
        <FullPageSpinner />
      ) : contacts && contacts.length > 0 ? (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-border-subtle py-2 last:border-0">
              <div>
                <p className="text-sm font-medium text-text">{c.name}</p>
                <p className="text-xs text-text-muted">
                  {c.relation}
                  {c.phone && ` · ${c.phone}`}
                </p>
              </div>
              {canEdit && (
                <button
                  aria-label="Delete contact"
                  onClick={() => setToDelete(c.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No emergency contacts yet.</p>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Add Emergency Contact">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name" {...register('name', { required: true })} />
          <Input label="Relation" {...register('relation')} />
          <Input label="Phone" {...register('phone')} />
          <Textarea label="Notes" {...register('notes')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createContact.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove contact?"
        confirmLabel="Remove"
        danger
        isLoading={deleteContact.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteContact.mutateAsync(toDelete);
          setToDelete(null);
        }}
      />
    </Card>
  );
}

function ImportantNumbersSection({ weddingId, canEdit }: { weddingId: string; canEdit: boolean }) {
  const { data: numbers, isLoading } = useImportantNumbers(weddingId);
  const createNumber = useCreateImportantNumber(weddingId);
  const deleteNumber = useDeleteImportantNumber(weddingId);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<ImportantNumberInput>({
    defaultValues: { label: '', phone: '', notes: '' },
  });

  const onSubmit = async (values: ImportantNumberInput) => {
    try {
      await createNumber.mutateAsync(values);
      toast.success('Number added.');
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add number.');
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Important Phone Numbers</h2>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>
      {isLoading ? (
        <FullPageSpinner />
      ) : numbers && numbers.length > 0 ? (
        <div className="space-y-2">
          {numbers.map((n) => (
            <div key={n.id} className="flex items-center justify-between border-b border-border-subtle py-2 last:border-0">
              <div>
                <p className="text-sm font-medium text-text">{n.label}</p>
                <p className="text-xs text-text-muted">{n.phone}</p>
              </div>
              {canEdit && (
                <button
                  aria-label="Delete number"
                  onClick={() => setToDelete(n.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No important numbers yet.</p>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Add Important Number">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name / Purpose" {...register('label', { required: true })} />
          <Input label="Phone" {...register('phone')} />
          <Textarea label="Notes" {...register('notes')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createNumber.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove number?"
        confirmLabel="Remove"
        danger
        isLoading={deleteNumber.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteNumber.mutateAsync(toDelete);
          setToDelete(null);
        }}
      />
    </Card>
  );
}

export function WeddingInfoPage() {
  const { wedding, role } = useCurrentWedding();
  const canEditCore = role === 'owner';
  const canEditLists = role !== 'viewer';

  return (
    <div className="space-y-4 p-4 pt-6 pb-6">
      <div className="mb-2 flex items-center gap-2">
        <IdCard className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-text">Wedding Information</h1>
      </div>
      <CoreDetailsForm weddingId={wedding.id} canEdit={canEditCore} />
      <EmergencyContactsSection weddingId={wedding.id} canEdit={canEditLists} />
      <ImportantNumbersSection weddingId={wedding.id} canEdit={canEditLists} />
    </div>
  );
}
