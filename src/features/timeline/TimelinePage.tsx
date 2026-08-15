import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Plus, Pencil, Trash2, CalendarDays, MapPin } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { TimelineFormDialog } from './TimelineFormDialog';
import { useDeleteTimelineEvent, useTimelineEvents } from './hooks';
import type { TimelineEvent } from './types';

function statusTone(status: string | null) {
  if (status === 'Done') return 'success' as const;
  if (status === 'In Progress') return 'info' as const;
  return 'neutral' as const;
}

function countdownLabel(dateStr: string | null) {
  if (!dateStr) return null;
  const days = dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  if (days === 0) return 'Today';
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
}

export function TimelinePage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: events, isLoading } = useTimelineEvents(wedding.id);
  const deleteTimelineEvent = useDeleteTimelineEvent(wedding.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  const openCreate = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const openEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<TimelineEvent, any>[]>(
    () => [
      { accessorKey: 'event_name', header: 'Event' },
      {
        accessorKey: 'event_date',
        header: 'Date',
        cell: ({ getValue }) => (getValue<string>() ? dayjs(getValue<string>()).format('DD MMM YYYY') : '—'),
      },
      { accessorKey: 'event_time', header: 'Time', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'venue', header: 'Venue', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'responsible_person', header: 'Responsible Person', cell: ({ getValue }) => getValue<string>() || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (getValue<string>() ? <Badge tone={statusTone(getValue<string>())}>{getValue<string>()}</Badge> : '—'),
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: TimelineEvent } }) => (
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit event"
                    onClick={() => openEdit(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete event"
                    onClick={() => setEventToDelete(row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<TimelineEvent, any>,
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
          <h1 className="text-lg font-semibold text-text">Timeline</h1>
          <p className="text-sm text-text-muted">{events?.length ?? 0} events</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton
            weddingId={wedding.id}
            role={role}
            lists={[
              { listType: 'timeline_event', label: 'Timeline Event' },
              { listType: 'timeline_status', label: 'Timeline Status' },
            ]}
          />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Add your first function to start the timeline."
          action={
            canEdit ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {events.map((event) => {
              const countdown = countdownLabel(event.event_date);
              return (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{event.event_name}</p>
                      <p className="text-xs text-text-muted">
                        {event.event_date ? dayjs(event.event_date).format('DD MMM YYYY') : 'No date set'}
                        {event.event_time && ` · ${event.event_time}`}
                      </p>
                    </div>
                    {event.status && <Badge tone={statusTone(event.status)}>{event.status}</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    {countdown && <span className="font-medium text-primary">{countdown}</span>}
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.venue}
                      </span>
                    )}
                    {event.responsible_person && <span>{event.responsible_person}</span>}
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(event)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEventToDelete(event)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={events} pageSize={25} />
          </div>
        </>
      )}

      <TimelineFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} timelineEvent={editingEvent} />

      <ConfirmDialog
        open={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        title="Delete event?"
        description={`"${eventToDelete?.event_name ?? 'This event'}" will be removed from the timeline.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteTimelineEvent.isPending}
        onConfirm={async () => {
          if (!eventToDelete) return;
          try {
            await deleteTimelineEvent.mutateAsync(eventToDelete.id);
            toast.success('Event deleted.');
            setEventToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete event.');
          }
        }}
      />
    </div>
  );
}
