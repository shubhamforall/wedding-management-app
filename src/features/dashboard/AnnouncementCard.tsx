import { useState } from 'react';
import { Megaphone, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAnnouncement, useUpdateAnnouncement } from './hooks';

export function AnnouncementCard({ weddingId, canEdit }: { weddingId: string; canEdit: boolean }) {
  const { data: announcement, isLoading } = useAnnouncement(weddingId);
  const updateAnnouncement = useUpdateAnnouncement(weddingId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEditing = () => {
    setDraft(announcement?.message ?? '');
    setEditing(true);
  };

  const save = async () => {
    try {
      await updateAnnouncement.mutateAsync(draft);
      setEditing(false);
      toast.success('Announcement updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update announcement.');
    }
  };

  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-info-bg text-info">
        <Megaphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-muted">Latest Announcement</p>
        {isLoading ? (
          <Spinner className="mt-1 h-4 w-4" />
        ) : editing ? (
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Caterer tasting moved to Friday 6pm"
              className="flex-1"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={save} isLoading={updateAnnouncement.isPending}>
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="text-sm text-text">
              {announcement?.message || <span className="text-text-faint">No announcement yet.</span>}
            </p>
            {canEdit && (
              <button
                aria-label="Edit announcement"
                onClick={startEditing}
                className="shrink-0 text-text-muted hover:text-text"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {announcement?.updated_at && !editing && announcement.message && (
          <p className="mt-1 text-xs text-text-faint">Updated {dayjs(announcement.updated_at).format('DD MMM, h:mm A')}</p>
        )}
      </div>
    </Card>
  );
}
