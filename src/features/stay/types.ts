export interface StayArrangement {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  guest_name_freeform: string | null;
  villa: string | null;
  address: string | null;
  responsible_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StayArrangementInput {
  guest_id: string | null;
  guest_name_freeform: string | null;
  villa: string | null;
  address: string | null;
  responsible_person: string | null;
  notes: string | null;
}

export function stayGuestLabel(row: Pick<StayArrangement, 'guest_name_freeform'>, guestFamilyName?: string) {
  return guestFamilyName ?? row.guest_name_freeform ?? 'Unknown guest';
}
