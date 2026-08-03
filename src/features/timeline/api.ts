import { supabase } from '@/lib/supabase';
import type { TimelineEvent, TimelineEventInput } from './types';

export async function fetchTimelineEvents(weddingId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('event_date', { ascending: true, nullsFirst: true })
    .returns<TimelineEvent[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createTimelineEvent(weddingId: string, input: TimelineEventInput): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Timeline event creation returned no data.');
  return data as TimelineEvent;
}

export async function updateTimelineEvent(id: string, input: TimelineEventInput): Promise<TimelineEvent> {
  const { data, error } = await supabase.from('timeline_events').update(input).eq('id', id).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Timeline event update returned no data.');
  return data as TimelineEvent;
}

export async function deleteTimelineEvent(id: string) {
  const { error } = await supabase.from('timeline_events').delete().eq('id', id);
  if (error) throw error;
}
