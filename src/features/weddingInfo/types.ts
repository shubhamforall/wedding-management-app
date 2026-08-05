export interface EmergencyContact {
  id: string;
  wedding_id: string;
  name: string;
  relation: string | null;
  phone: string | null;
  notes: string | null;
}

export interface EmergencyContactInput {
  name: string;
  relation: string | null;
  phone: string | null;
  notes: string | null;
}

export interface ImportantNumber {
  id: string;
  wedding_id: string;
  label: string;
  phone: string | null;
  notes: string | null;
}

export interface ImportantNumberInput {
  label: string;
  phone: string | null;
  notes: string | null;
}

export interface WeddingInfoInput {
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  reception_date: string | null;
  venue: string | null;
  address: string | null;
}
