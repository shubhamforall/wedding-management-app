import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { LIST_TYPES, LIST_TYPE_LABELS } from './types';
import { ValueList } from './ValueList';

export function SettingsPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const canDelete = role === 'owner';

  const [activeType, setActiveType] = useState(LIST_TYPES[0]!);

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold text-text">Settings</h1>
          <p className="text-sm text-text-muted">
            Manage the dropdown values used across every module. Changes here apply instantly everywhere.
          </p>
        </div>
      </div>

      {/* Mobile: category select */}
      <div className="mb-4 md:hidden">
        <Select value={activeType} onChange={(e) => setActiveType(e.target.value as typeof activeType)}>
          {LIST_TYPES.map((type) => (
            <option key={type} value={type}>
              {LIST_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:hidden">
        <ValueList
          weddingId={wedding.id}
          listType={activeType}
          label={LIST_TYPE_LABELS[activeType]}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      {/* Desktop: sidebar of categories + value list */}
      <div className="hidden gap-6 md:grid md:grid-cols-[220px_1fr]">
        <nav className="space-y-0.5">
          {LIST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                'block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium transition-colors',
                type === activeType ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-subtle hover:text-text'
              )}
            >
              {LIST_TYPE_LABELS[type]}
            </button>
          ))}
        </nav>
        <ValueList
          weddingId={wedding.id}
          listType={activeType}
          label={LIST_TYPE_LABELS[activeType]}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
