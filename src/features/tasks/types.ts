export interface Task {
  id: string;
  wedding_id: string;
  task: string;
  category: string | null;
  assigned_to: string | null;
  priority: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  task: string;
  category: string | null;
  assigned_to: string | null;
  priority: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string;
  comments: string | null;
}

export function isOverdue(t: Pick<Task, 'status' | 'due_date'>) {
  if (!t.due_date || t.status === 'Completed') return false;
  return new Date(t.due_date) < new Date(new Date().toDateString());
}
