import { supabase } from '@/lib/supabase';
import type { ListOption, ListType } from '@/types/database';

export async function fetchListOptions(weddingId: string, listType: ListType): Promise<ListOption[]> {
  const { data, error } = await supabase
    .from('list_options')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('list_type', listType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .returns<ListOption[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createListOption(weddingId: string, listType: ListType, value: string, sortOrder: number) {
  const { error } = await supabase
    .from('list_options')
    .insert({ wedding_id: weddingId, list_type: listType, value: value.trim(), sort_order: sortOrder });

  if (error) throw error;
}

export async function updateListOptionValue(id: string, value: string) {
  const { error } = await supabase.from('list_options').update({ value: value.trim() }).eq('id', id);
  if (error) throw error;
}

export async function updateListOptionOrder(id: string, sortOrder: number) {
  const { error } = await supabase.from('list_options').update({ sort_order: sortOrder }).eq('id', id);
  if (error) throw error;
}

export async function deleteListOption(id: string) {
  const { error } = await supabase.from('list_options').delete().eq('id', id);
  if (error) throw error;
}
