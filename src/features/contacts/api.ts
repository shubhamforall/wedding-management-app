import { supabase } from '@/lib/supabase';
import type { ContactRow, ManualContactInput } from './types';

export async function fetchFamilyEmergencyContacts(weddingId: string): Promise<ContactRow[]> {
  const [emergency, important] = await Promise.all([
    supabase
      .from('emergency_contacts')
      .select('id, name, relation, phone, notes')
      .eq('wedding_id', weddingId)
      .returns<{ id: string; name: string; relation: string | null; phone: string | null; notes: string | null }[]>(),
    supabase
      .from('important_numbers')
      .select('id, label, phone, notes')
      .eq('wedding_id', weddingId)
      .returns<{ id: string; label: string; phone: string | null; notes: string | null }[]>(),
  ]);

  if (emergency.error) throw emergency.error;
  if (important.error) throw important.error;

  const emergencyRows: ContactRow[] = (emergency.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.relation ? `Emergency (${c.relation})` : 'Emergency',
    phone: c.phone,
    alternate_phone: null,
    notes: c.notes,
    source: 'emergency',
  }));

  const importantRows: ContactRow[] = (important.data ?? []).map((n) => ({
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
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, category, phone, alternate_phone, notes')
    .eq('wedding_id', weddingId)
    .returns<{ id: string; name: string; category: string | null; phone: string | null; alternate_phone: string | null; notes: string | null }[]>();

  if (error) throw error;

  return (data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    type: v.category ? `${v.category} Vendor` : 'Vendor',
    phone: v.phone,
    alternate_phone: v.alternate_phone,
    notes: v.notes,
    source: 'vendor' as const,
  }));
}

export async function fetchManualContacts(weddingId: string): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, type, phone, alternate_phone, notes')
    .eq('wedding_id', weddingId)
    .eq('source', 'manual')
    .returns<ContactRow[]>();

  if (error) throw error;
  return (data ?? []).map((c) => ({ ...c, source: 'manual' as const }));
}

export async function createManualContact(weddingId: string, input: ManualContactInput) {
  const { error } = await supabase.from('contacts').insert({ ...input, wedding_id: weddingId, source: 'manual' });
  if (error) throw error;
}

export async function updateManualContact(id: string, input: ManualContactInput) {
  const { error } = await supabase.from('contacts').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteManualContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}
