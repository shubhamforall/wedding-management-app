export type WeddingSide = 'groom' | 'bride' | 'both';
export type WeddingRole = 'owner' | 'member' | 'viewer';
export type MemberStatus = 'active' | 'removed';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type ListType =
  | 'family_members'
  | 'budget_category'
  | 'vendor_category'
  | 'payment_mode'
  | 'expense_status'
  | 'invitation_status'
  | 'shopping_category'
  | 'shopping_status'
  | 'inventory_status'
  | 'task_category'
  | 'task_priority'
  | 'task_status'
  | 'timeline_event'
  | 'timeline_status'
  | 'contact_type'
  | 'document_category';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface Wedding {
  id: string;
  name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  reception_date: string | null;
  venue: string | null;
  address: string | null;
  wedding_side: WeddingSide;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  status: MemberStatus;
  joined_at: string;
  created_at: string;
}

export interface WeddingInvitation {
  id: string;
  wedding_id: string;
  email: string;
  role: WeddingRole;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

export interface ListOption {
  id: string;
  wedding_id: string;
  list_type: ListType;
  value: string;
  sort_order: number;
  is_active: boolean;
}

export interface WeddingInsert extends Partial<Wedding> {
  name: string;
  bride_name: string;
  groom_name: string;
  owner_id: string;
}
