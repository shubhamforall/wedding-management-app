import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useInviteMember } from './hooks';
import type { WeddingRole } from '@/types/database';

interface FormValues {
  email: string;
  role: WeddingRole;
}

export function InviteMemberDialog({
  weddingId,
  weddingName,
  open,
  onClose,
}: {
  weddingId: string;
  weddingName: string;
  open: boolean;
  onClose: () => void;
}) {
  const inviteMember = useInviteMember(weddingId, weddingName);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { role: 'member' } });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { emailSent } = await inviteMember.mutateAsync(values);
      if (emailSent) {
        toast.success(`Invitation sent to ${values.email}`);
      } else {
        toast.error(`Invitation created, but the email to ${values.email} could not be sent. Share the invite link from the Members list.`);
      }
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send invitation.');
    }
  };

  return (
    <Dialog open={open} onClose={close} title="Invite Member" description="They'll get an email to join this wedding.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          })}
        />
        <Select label="Role" {...register('role')}>
          <option value="member">Member — can edit guests, budget, tasks, etc.</option>
          <option value="viewer">Viewer — read only</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={inviteMember.isPending}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
