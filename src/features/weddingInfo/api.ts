import { supabase } from '@/lib/supabase';
import type {
  EmergencyContact,
  EmergencyContactInput,
  ImportantNumber,
  ImportantNumberInput,
  WeddingInfoInput,
} from './types';

export async function updateWeddingInfo(weddingId: string, input: WeddingInfoInput) {
  const { error } = await supabase.from('weddings').update(input).eq('id', weddingId);
  if (error) throw error;
}

export async function fetchEmergencyContacts(weddingId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<EmergencyContact[]>();
  if (error) throw error;
  return data ?? [];
}

export async function createEmergencyContact(weddingId: string, input: EmergencyContactInput) {
  const { error } = await supabase.from('emergency_contacts').insert({ ...input, wedding_id: weddingId });
  if (error) throw error;
}

export async function updateEmergencyContact(id: string, input: EmergencyContactInput) {
  const { error } = await supabase.from('emergency_contacts').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteEmergencyContact(id: string) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchImportantNumbers(weddingId: string): Promise<ImportantNumber[]> {
  const { data, error } = await supabase
    .from('important_numbers')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<ImportantNumber[]>();
  if (error) throw error;
  return data ?? [];
}

export async function createImportantNumber(weddingId: string, input: ImportantNumberInput) {
  const { error } = await supabase.from('important_numbers').insert({ ...input, wedding_id: weddingId });
  if (error) throw error;
}

export async function updateImportantNumber(id: string, input: ImportantNumberInput) {
  const { error } = await supabase.from('important_numbers').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteImportantNumber(id: string) {
  const { error } = await supabase.from('important_numbers').delete().eq('id', id);
  if (error) throw error;
}
