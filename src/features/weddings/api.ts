import { supabase } from '@/lib/supabase';
import type { Wedding, WeddingInsert, WeddingRole } from '@/types/database';

export interface WeddingWithRole extends Wedding {
  role: WeddingRole;
}

interface MembershipRow {
  role: WeddingRole;
  weddings: Wedding | null;
}

export async function fetchMyWeddings(): Promise<WeddingWithRole[]> {
  const { data, error } = await supabase
    .from('wedding_members')
    .select('role, weddings(*)')
    .eq('status', 'active')
    .order('created_at', { referencedTable: 'weddings', ascending: false })
    .returns<MembershipRow[]>();

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is MembershipRow & { weddings: Wedding } => row.weddings !== null)
    .map((row) => ({ ...row.weddings, role: row.role }));
}

export interface CreateWeddingInput {
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date?: string | null;
  reception_date?: string | null;
  venue?: string | null;
  wedding_side: Wedding['wedding_side'];
}

export async function createWedding(input: CreateWeddingInput): Promise<Wedding> {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userRes.user) throw new Error('Not signed in.');

  const payload: WeddingInsert = { ...input, owner_id: userRes.user.id };

  const { data, error } = await supabase.from('weddings').insert(payload).select().single();

  if (error) throw error;
  if (!data) throw new Error('Wedding creation returned no data.');
  return data as Wedding;
}
