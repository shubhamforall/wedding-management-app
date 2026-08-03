import { supabase } from '@/lib/supabase';
import type { Task, TaskInput } from './types';

export async function fetchTasks(weddingId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .returns<Task[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createTask(weddingId: string, input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...input, wedding_id: weddingId })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Task creation returned no data.');
  return data as Task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select('*').single();

  if (error) throw error;
  if (!data) throw new Error('Task update returned no data.');
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
