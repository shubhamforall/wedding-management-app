import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput } from './types';

export async function fetchGuests(weddingId: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<Guest[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createGuest(weddingId: string, input: GuestInput): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Guest creation returned no data.');
  return data as Guest;
}

export async function updateGuest(guestId: string, input: GuestInput): Promise<Guest> {
  const { data, error } = await supabase.from('guests').update(input).eq('id', guestId).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Guest update returned no data.');
  return data as Guest;
}

export async function deleteGuest(guestId: string) {
  const { error } = await supabase.from('guests').delete().eq('id', guestId);
  if (error) throw error;
}
