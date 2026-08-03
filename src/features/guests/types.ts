export interface Guest {
  id: string;
  wedding_id: string;
  family_name: string;
  village_city: string | null;
  phone: string | null;
  whatsapp: string | null;
  total_members: number;
  invitation_status: string;
  attending_engagement: boolean;
  attending_haldi: boolean;
  attending_wedding: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestInput {
  family_name: string;
  village_city: string | null;
  phone: string | null;
  whatsapp: string | null;
  total_members: number;
  invitation_status: string;
  attending_engagement: boolean;
  attending_haldi: boolean;
  attending_wedding: boolean;
  notes: string | null;
}

export interface GuestFilters {
  search: string;
  invitationStatus: string;
}
