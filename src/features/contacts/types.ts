export type ContactSource = 'manual' | 'emergency' | 'important_number' | 'vendor';

export interface ContactRow {
  id: string;
  name: string;
  type: string | null;
  phone: string | null;
  alternate_phone: string | null;
  notes: string | null;
  source: ContactSource;
}

export interface ManualContactInput {
  name: string;
  type: string | null;
  phone: string | null;
  alternate_phone: string | null;
  notes: string | null;
}
