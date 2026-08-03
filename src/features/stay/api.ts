import { supabase } from '@/lib/supabase';
import type { StayArrangement, StayArrangementInput } from './types';

export async function fetchStayArrangements(weddingId: string): Promise<StayArrangement[]> {
  const { data, error } = await supabase
    .from('stay_arrangements')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<StayArrangement[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createStayArrangement(weddingId: string, input: StayArrangementInput): Promise<StayArrangement> {
  const { data, error } = await supabase
    .from('stay_arrangements')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Stay arrangement creation returned no data.');
  return data as StayArrangement;
}

export async function updateStayArrangement(id: string, input: StayArrangementInput): Promise<StayArrangement> {
  const { data, error } = await supabase.from('stay_arrangements').update(input).eq('id', id).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Stay arrangement update returned no data.');
  return data as StayArrangement;
}

export async function deleteStayArrangement(id: string) {
  const { error } = await supabase.from('stay_arrangements').delete().eq('id', id);
  if (error) throw error;
}
