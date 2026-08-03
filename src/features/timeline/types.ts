export interface TimelineEvent {
  id: string;
  wedding_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  responsible_person: string | null;
  checklist: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEventInput {
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  responsible_person: string | null;
  checklist: string | null;
  status: string | null;
  notes: string | null;
}
