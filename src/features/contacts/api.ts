import { api } from '@/lib/api';
import { createCrudApi } from '@/lib/createCrudApi';
import { toSnakeCaseArray } from '@/lib/caseMapping';
import type { ContactRow, ManualContactInput } from './types';

export async function fetchFamilyEmergencyContacts(weddingId: string): Promise<ContactRow[]> {
  const [emergencyRes, importantRes] = await Promise.all([
    api.get<{ items: Record<string, unknown>[] }>(`/weddings/${weddingId}/emergency-contacts`),
    api.get<{ items: Record<string, unknown>[] }>(`/weddings/${weddingId}/important-numbers`),
  ]);

  const emergency = toSnakeCaseArray<{ id: string; name: string; relation: string | null; phone: string | null; notes: string | null }>(
    emergencyRes.items
  );
  const important = toSnakeCaseArray<{ id: string; label: string; phone: string | null; notes: string | null }>(
    importantRes.items
  );

  const emergencyRows: ContactRow[] = emergency.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.relation ? `Emergency (${c.relation})` : 'Emergency',
    phone: c.phone,
    alternate_phone: null,
    notes: c.notes,
    source: 'emergency',
  }));

  const importantRows: ContactRow[] = important.map((n) => ({
    id: n.id,
    name: n.label,
    type: 'Important Number',
    phone: n.phone,
    alternate_phone: null,
    notes: n.notes,
    source: 'important_number',
  }));

  return [...emergencyRows, ...importantRows];
}

export async function fetchVendorContacts(weddingId: string): Promise<ContactRow[]> {
  const { items } = await api.get<{ items: Record<string, unknown>[] }>(`/weddings/${weddingId}/vendors`);
  const vendors = toSnakeCaseArray<{
    id: string;
    name: string;
    category: string | null;
    phone: string | null;
    alternate_phone: string | null;
    notes: string | null;
  }>(items);

  return vendors.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.category ? `${v.category} Vendor` : 'Vendor',
    phone: v.phone,
    alternate_phone: v.alternate_phone,
    notes: v.notes,
    source: 'vendor' as const,
  }));
}

const manualCrud = createCrudApi<ContactRow, ManualContactInput>('contacts');

export async function fetchManualContacts(weddingId: string): Promise<ContactRow[]> {
  const rows = await manualCrud.fetchAll(weddingId);
  return rows.map((c) => ({ ...c, source: 'manual' as const }));
}

export const createManualContact = manualCrud.create;
export const updateManualContact = manualCrud.update;
export const deleteManualContact = manualCrud.remove;
