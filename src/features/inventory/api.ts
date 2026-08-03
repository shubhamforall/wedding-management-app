import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryItemInput } from './types';

export async function fetchInventoryItems(weddingId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<InventoryItem[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createInventoryItem(weddingId: string, input: InventoryItemInput): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Inventory item creation returned no data.');
  return data as InventoryItem;
}

export async function updateInventoryItem(id: string, input: InventoryItemInput): Promise<InventoryItem> {
  const { data, error } = await supabase.from('inventory_items').update(input).eq('id', id).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Inventory item update returned no data.');
  return data as InventoryItem;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}
