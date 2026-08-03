import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useCreateTask, useUpdateTask } from './hooks';
import type { Task, TaskInput } from './types';

const emptyValues: TaskInput = {
  task: '',
  category: '',
  assigned_to: '',
  priority: '',
  start_date: null,
  due_date: null,
  status: 'Not Started',
  comments: '',
};

export function TaskFormDialog({
  weddingId,
  open,
  onClose,
  task,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  task: Task | null;
}) {
  const { data: categoryOptions } = useListOptions(weddingId, 'task_category');
  const { data: priorityOptions } = useListOptions(weddingId, 'task_priority');
  const { data: statusOptions } = useListOptions(weddingId, 'task_status');
  const { data: familyMemberOptions } = useListOptions(weddingId, 'family_members');
  const createTask = useCreateTask(weddingId);
  const updateTask = useUpdateTask(weddingId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      reset(task ? { ...task } : { ...emptyValues, status: statusOptions?.[0]?.value ?? 'Not Started' });
    }
  }, [open, task, reset, statusOptions]);

  const isPending = createTask.isPending || updateTask.isPending;

  const onSubmit = async (values: TaskInput) => {
    const payload: TaskInput = {
      ...values,
      start_date: values.start_date || null,
      due_date: values.due_date || null,
    };
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, input: payload });
        toast.success('Task updated.');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Task added.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save task.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={task ? 'Edit Task' : 'Add Task'}>
      <form className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Task" error={errors.task?.message} {...register('task', { required: 'Task is required' })} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" {...register('category')}>
            <option value="">— Select —</option>
            {(categoryOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
          <Select label="Assigned To" {...register('assigned_to')}>
            <option value="">— Select —</option>
            {(familyMemberOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Priority" {...register('priority')}>
            <option value="">— Select —</option>
            {(priorityOptions ?? []).map((opt) => (
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

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" {...register('start_date')} />
          <Input label="Due Date" type="date" {...register('due_date')} />
        </div>

        <Textarea label="Comments" {...register('comments')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {task ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
