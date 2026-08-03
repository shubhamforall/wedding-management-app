import { supabase } from '@/lib/supabase';
import type { Vendor, VendorInput } from './types';

export async function fetchVendors(weddingId: string): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
    .returns<Vendor[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createVendor(weddingId: string, input: VendorInput): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Vendor creation returned no data.');
  return data as Vendor;
}

export async function updateVendor(vendorId: string, input: VendorInput): Promise<Vendor> {
  const { data, error } = await supabase.from('vendors').update(input).eq('id', vendorId).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Vendor update returned no data.');
  return data as Vendor;
}

export async function deleteVendor(vendorId: string) {
  const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
  if (error) throw error;
}
