import { supabase } from '@/lib/supabase';
import type { ShoppingItem, ShoppingItemInput } from './types';

export async function fetchShoppingItems(weddingId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<ShoppingItem[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createShoppingItem(weddingId: string, input: ShoppingItemInput): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Shopping item creation returned no data.');
  return data as ShoppingItem;
}

export async function updateShoppingItem(id: string, input: ShoppingItemInput): Promise<ShoppingItem> {
  const { data, error } = await supabase.from('shopping_items').update(input).eq('id', id).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Shopping item update returned no data.');
  return data as ShoppingItem;
}

export async function deleteShoppingItem(id: string) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}
