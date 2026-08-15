export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  emailVerified: boolean;
}
