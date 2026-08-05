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

export async function deleteWedding(weddingId: string) {
  const { error } = await supabase.from('weddings').delete().eq('id', weddingId);
  if (error) throw error;
}

export interface MyPendingInvitation {
  id: string;
  wedding_id: string;
  wedding_name: string | null;
  role: WeddingRole;
  token: string;
  expires_at: string;
}

// Relies entirely on RLS ("invitees can view own pending invite": email =
// their JWT email, status = 'pending') to scope this to the signed-in
// user — no email filter needed client-side. Can't join to `weddings` for
// the name since the invitee isn't a member yet and that table's RLS would
// block it; wedding_name is denormalized onto the invitation row instead
// (see migration 0012) specifically so this query doesn't need that join.
export async function fetchMyPendingInvitations(): Promise<MyPendingInvitation[]> {
  const { data, error } = await supabase
    .from('wedding_invitations')
    .select('id, wedding_id, wedding_name, role, token, expires_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .returns<MyPendingInvitation[]>();

  if (error) throw error;
  return data ?? [];
}
