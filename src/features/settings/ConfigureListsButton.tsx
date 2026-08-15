import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';
import type { ListType, WeddingRole } from '@/types/database';
import { ValueList } from './ValueList';

interface ConfigureListsButtonProps {
  weddingId: string;
  role: WeddingRole;
  lists: { listType: ListType; label: string }[];
}

// Per-module replacement for the old standalone Settings page — each page
// that actually uses dropdown values gets a small button here to configure
// just its own lists, instead of a separate hub unrelated to where those
// values are used. See ValueList.tsx for the actual editor UI, unchanged.
export function ConfigureListsButton({ weddingId, role, lists }: ConfigureListsButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState(lists[0]!.listType);
  const canEdit = role !== 'viewer';
  const canDelete = role === 'owner';

  const activeLabel = lists.find((l) => l.listType === activeType)?.label ?? '';

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Configure
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Configure options"
        description="These dropdown values apply instantly everywhere they're used."
      >
        {lists.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2 border-b border-border-subtle pb-4">
            {lists.map((l) => (
              <button
                key={l.listType}
                type="button"
                onClick={() => setActiveType(l.listType)}
                className={cn(
                  'flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors',
                  l.listType === activeType
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-bg-subtle text-text-muted hover:border-border-strong hover:text-text'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        <ValueList weddingId={weddingId} listType={activeType} label={activeLabel} canEdit={canEdit} canDelete={canDelete} />
      </Dialog>
    </>
  );
}
