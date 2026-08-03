import { supabase } from '@/lib/supabase';
import type { DashboardStats, WeddingAnnouncement } from './types';

export async function fetchDashboardStats(weddingId: string): Promise<DashboardStats> {
  const { data, error } = await supabase.from('dashboard_stats').select('*').eq('wedding_id', weddingId).single();

  if (error) throw error;
  if (!data) throw new Error('Dashboard stats returned no data.');
  return data as DashboardStats;
}

export async function fetchAnnouncement(weddingId: string): Promise<WeddingAnnouncement> {
  const { data, error } = await supabase
    .from('wedding_announcements')
    .select('*')
    .eq('wedding_id', weddingId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Announcement returned no data.');
  return data as WeddingAnnouncement;
}

export async function updateAnnouncement(weddingId: string, message: string) {
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('wedding_announcements')
    .update({ message, updated_by: userRes.user?.id, updated_at: new Date().toISOString() })
    .eq('wedding_id', weddingId);

  if (error) throw error;
}
