import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Plus, Pencil, Trash2, ListTodo } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useListOptions } from '@/hooks/useListOptions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { cn } from '@/lib/cn';
import { TaskFormDialog } from './TaskFormDialog';
import { useDeleteTask, useTasks } from './hooks';
import { isOverdue, type Task } from './types';

function statusTone(status: string) {
  if (status === 'Completed') return 'success' as const;
  if (status === 'In Progress') return 'info' as const;
  return 'neutral' as const;
}

function priorityTone(priority: string | null) {
  if (priority === 'High') return 'danger' as const;
  if (priority === 'Medium') return 'warning' as const;
  return 'neutral' as const;
}

export function TasksPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: tasks, isLoading } = useTasks(wedding.id);
  const { data: categoryOptions } = useListOptions(wedding.id, 'task_category');
  const { data: statusOptions } = useListOptions(wedding.id, 'task_status');
  const deleteTask = useDeleteTask(wedding.id);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const stats = useMemo(() => {
    if (!tasks) return { pending: 0, completed: 0, overdue: 0, progress: 0 };
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const overdue = tasks.filter(isOverdue).length;
    return {
      pending: tasks.length - completed,
      completed,
      overdue,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch = !q || t.task.toLowerCase().includes(q) || t.assigned_to?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, search, categoryFilter, statusFilter]);

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Task, any>[]>(
    () => [
      { accessorKey: 'task', header: 'Task' },
      { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'assigned_to', header: 'Assigned To', cell: ({ getValue }) => getValue<string>() || '—' },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => (getValue<string>() ? <Badge tone={priorityTone(getValue<string>())}>{getValue<string>()}</Badge> : '—'),
      },
      {
        accessorKey: 'due_date',
        header: 'Due Date',
        cell: ({ row }) =>
          row.original.due_date ? (
            <span className={cn(isOverdue(row.original) && 'font-medium text-danger')}>
              {dayjs(row.original.due_date).format('DD MMM YYYY')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <Badge tone={statusTone(getValue<string>())}>{getValue<string>()}</Badge>,
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: Task } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit task"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete task"
                    onClick={() => setTaskToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<Task, any>,
          ]
        : []),
    ],
    [canEdit]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Tasks</h1>
          <p className="text-sm text-text-muted">{tasks?.length ?? 0} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton
            weddingId={wedding.id}
            role={role}
            lists={[
              { listType: 'task_category', label: 'Task Category' },
              { listType: 'task_priority', label: 'Task Priority' },
              { listType: 'task_status', label: 'Task Status' },
            ]}
          />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Pending</p>
          <p className="mt-1 text-lg font-semibold text-text">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Completed</p>
          <p className="mt-1 text-lg font-semibold text-text">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Overdue</p>
          <p className={cn('mt-1 text-lg font-semibold', stats.overdue > 0 ? 'text-danger' : 'text-text')}>{stats.overdue}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Overall Progress</p>
          <p className="mt-1 text-lg font-semibold text-text">{stats.progress}%</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search task, assigned to..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-44">
          <option value="all">All Categories</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">All Statuses</option>
          {(statusOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={tasks?.length ? 'No tasks match your search' : 'No tasks yet'}
          description={tasks?.length ? 'Try a different search or filter.' : 'Add your first task to get started.'}
          action={
            canEdit && !tasks?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{task.task}</p>
                    <p className="text-xs text-text-muted">{task.category || 'Uncategorized'}</p>
                  </div>
                  <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  {task.assigned_to && <span>{task.assigned_to}</span>}
                  {task.priority && <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>}
                  {task.due_date && (
                    <span className={cn(isOverdue(task) && 'font-medium text-danger')}>
                      Due {dayjs(task.due_date).format('DD MMM YYYY')}
                    </span>
                  )}
                </div>
                {canEdit && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(task)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setTaskToDelete(task)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} pageSize={25} />
          </div>
        </>
      )}

      <TaskFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} task={editingTask} />

      <ConfirmDialog
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete task?"
        description={`"${taskToDelete?.task ?? 'This task'}" will be removed.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteTask.isPending}
        onConfirm={async () => {
          if (!taskToDelete) return;
          try {
            await deleteTask.mutateAsync(taskToDelete.id);
            toast.success('Task deleted.');
            setTaskToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete task.');
          }
        }}
      />
    </div>
  );
}
