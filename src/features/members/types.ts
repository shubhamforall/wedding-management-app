import type { InvitationStatus, MemberStatus, UserProfile, WeddingRole } from '@/types/database';

export interface MemberRow {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  status: MemberStatus;
  joined_at: string;
  user_profiles: UserProfile | null;
}

export interface InvitationRow {
  id: string;
  wedding_id: string;
  email: string;
  role: WeddingRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
}
