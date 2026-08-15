import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Phone, Contact as ContactIcon } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { ContactFormDialog } from './ContactFormDialog';
import { useDeleteManualContact, useFamilyEmergencyContacts, useManualContacts, useVendorContacts } from './hooks';
import type { ContactRow } from './types';

function ContactRowCard({
  contact,
  canEdit,
  onEdit,
  onDelete,
}: {
  contact: ContactRow;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{contact.name}</p>
        <p className="text-xs text-text-muted">{contact.type}</p>
        {contact.phone && (
          <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
            <Phone className="h-3 w-3" /> {contact.phone}
            {contact.alternate_phone && ` · ${contact.alternate_phone}`}
          </p>
        )}
      </div>
      {canEdit && onEdit && onDelete && (
        <div className="flex shrink-0 gap-1">
          <button
            aria-label="Edit contact"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            aria-label="Delete contact"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </Card>
  );
}

export function ContactsPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: familyContacts, isLoading: loadingFamily } = useFamilyEmergencyContacts(wedding.id);
  const { data: vendorContacts, isLoading: loadingVendors } = useVendorContacts(wedding.id);
  const { data: manualContacts, isLoading: loadingManual } = useManualContacts(wedding.id);
  const deleteManualContact = useDeleteManualContact(wedding.id);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactRow | null>(null);

  const filterRows = (rows: ContactRow[] | undefined) => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.phone?.includes(q) || r.type?.toLowerCase().includes(q));
  };

  const filteredFamily = useMemo(() => filterRows(familyContacts), [familyContacts, search]);
  const filteredVendors = useMemo(() => filterRows(vendorContacts), [vendorContacts, search]);
  const filteredManual = useMemo(() => filterRows(manualContacts), [manualContacts, search]);

  const isLoading = loadingFamily || loadingVendors || loadingManual;

  const openCreate = () => {
    setEditingContact(null);
    setFormOpen(true);
  };

  const openEdit = (contact: ContactRow) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

  if (isLoading) return <FullPageSpinner />;

  const totalCount = (familyContacts?.length ?? 0) + (vendorContacts?.length ?? 0) + (manualContacts?.length ?? 0);

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Contacts</h1>
          <p className="text-sm text-text-muted">{totalCount} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton weddingId={wedding.id} role={role} lists={[{ listType: 'contact_type', label: 'Contact Type' }]} />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          )}
        </div>
      </div>

      <Input placeholder="Search name, phone, type..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />

      {totalCount === 0 ? (
        <EmptyState icon={ContactIcon} title="No contacts yet" description="Contacts sync in from Wedding Info and Vendors, or add your own." />
      ) : (
        <div className="space-y-6">
          {filteredFamily.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text">Family &amp; Emergency Contacts</h2>
              <p className="mb-2 text-xs text-text-faint">Synced from Wedding Info — edit them there.</p>
              <div className="space-y-2">
                {filteredFamily.map((c) => (
                  <ContactRowCard key={c.id} contact={c} canEdit={false} />
                ))}
              </div>
            </div>
          )}

          {filteredVendors.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text">Vendor Contacts</h2>
              <p className="mb-2 text-xs text-text-faint">Synced from Vendors — edit them there.</p>
              <div className="space-y-2">
                {filteredVendors.map((c) => (
                  <ContactRowCard key={c.id} contact={c} canEdit={false} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-text">Other Contacts</h2>
            {filteredManual.length > 0 ? (
              <div className="space-y-2">
                {filteredManual.map((c) => (
                  <ContactRowCard
                    key={c.id}
                    contact={c}
                    canEdit={canEdit}
                    onEdit={() => openEdit(c)}
                    onDelete={() => setContactToDelete(c)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No manually added contacts yet.</p>
            )}
          </div>
        </div>
      )}

      <ContactFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} contact={editingContact} />

      <ConfirmDialog
        open={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        title="Delete contact?"
        description={`${contactToDelete?.name ?? 'This contact'} will be removed.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteManualContact.isPending}
        onConfirm={async () => {
          if (!contactToDelete) return;
          try {
            await deleteManualContact.mutateAsync(contactToDelete.id);
            toast.success('Contact deleted.');
            setContactToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete contact.');
          }
        }}
      />
    </div>
  );
}
