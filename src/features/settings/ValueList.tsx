import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Check, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ListOption, ListType } from '@/types/database';
import { computeReorderSwap } from './types';
import {
  useCreateListOption,
  useDeleteListOption,
  useReorderListOptions,
  useSettingsListOptions,
  useUpdateListOptionValue,
} from './hooks';

function ValueRow({
  option,
  index,
  total,
  canEdit,
  canDelete,
  onSave,
  onDelete,
  onMove,
}: {
  option: ListOption;
  index: number;
  total: number;
  canEdit: boolean;
  canDelete: boolean;
  onSave: (value: string) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.value);

  const startEdit = () => {
    setDraft(option.value);
    setEditing(true);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error('Value cannot be empty.');
      return;
    }
    onSave(trimmed);
    setEditing(false);
  };

  return (
    <Card className="flex items-center gap-2 p-3">
      {editing ? (
        <>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="h-9 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <button
            aria-label="Save"
            onClick={save}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-success hover:bg-success-bg"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            aria-label="Cancel"
            onClick={() => setEditing(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-sm text-text">{option.value}</span>
          {canEdit && (
            <>
              <button
                aria-label="Move up"
                onClick={() => onMove('up')}
                disabled={index === 0}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                aria-label="Move down"
                onClick={() => onMove('down')}
                disabled={index === total - 1}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                aria-label="Edit value"
                onClick={startEdit}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
          {canDelete && (
            <button
              aria-label="Delete value"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </Card>
  );
}

export function ValueList({
  weddingId,
  listType,
  label,
  canEdit,
  canDelete,
}: {
  weddingId: string;
  listType: ListType;
  label: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { data: options, isLoading } = useSettingsListOptions(weddingId, listType);
  const createOption = useCreateListOption(weddingId, listType);
  const updateValue = useUpdateListOptionValue(weddingId, listType);
  const reorder = useReorderListOptions(weddingId, listType);
  const deleteOption = useDeleteListOption(weddingId, listType);

  const [newValue, setNewValue] = useState('');
  const [toDelete, setToDelete] = useState<ListOption | null>(null);

  if (isLoading) return <FullPageSpinner />;

  const rows = options ?? [];

  const addValue = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    const nextSortOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 1;
    try {
      await createOption.mutateAsync({ value: trimmed, sortOrder: nextSortOrder });
      setNewValue('');
      toast.success('Value added.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add value.');
    }
  };

  const move = async (index: number, direction: 'up' | 'down') => {
    const swap = computeReorderSwap(rows, index, direction);
    if (!swap) return;
    try {
      await reorder.mutateAsync(swap);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder.');
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text">{label}</h2>

      {rows.length === 0 ? (
        <EmptyState icon={ListChecks} title="No values yet" description={canEdit ? 'Add the first one below.' : 'Nothing configured here yet.'} />
      ) : (
        <div className="space-y-2">
          {rows.map((option, index) => (
            <ValueRow
              key={option.id}
              option={option}
              index={index}
              total={rows.length}
              canEdit={canEdit}
              canDelete={canDelete}
              onSave={async (value) => {
                try {
                  await updateValue.mutateAsync({ id: option.id, value });
                  toast.success('Value updated.');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Could not update value.');
                }
              }}
              onDelete={() => setToDelete(option)}
              onMove={(direction) => move(index, direction)}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <div className="mt-3 flex gap-2">
          <Input
            placeholder={`Add a new ${label.toLowerCase()} value...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addValue();
            }}
          />
          <Button onClick={addValue} isLoading={createOption.isPending}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete value?"
        description={`"${toDelete?.value ?? ''}" will no longer appear as a dropdown option. Existing records that already used it keep their value.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteOption.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteOption.mutateAsync(toDelete.id);
            toast.success('Value deleted.');
            setToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete value.');
          }
        }}
      />
    </div>
  );
}
