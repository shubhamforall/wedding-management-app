// Survives the full signup → email verification → click-link-in-a-new-tab
// journey, which loses React Router's in-memory redirect state entirely.
// Written the moment /invite/:token is visited (regardless of auth state),
// read back after any successful sign-in or email-confirmation callback.
const STORAGE_KEY = 'pending_invite_token';

export function setPendingInviteToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function consumePendingInviteToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) localStorage.removeItem(STORAGE_KEY);
  return token;
}
