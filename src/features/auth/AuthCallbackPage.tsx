import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { verifyEmail } from './api';
import { useAuth } from './AuthProvider';
import { consumePendingInviteToken } from '@/lib/pendingInvite';

// Handles two arrivals at this route: an email-verification link
// (?token=...&type=verify) and, in the future, an OAuth redirect once
// Google sign-in is wired up on the new backend (see MIGRATION_ANALYSIS.md
// Section I) — both just need to land the user somewhere sensible once
// whatever they clicked has been handled.
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, refreshAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    async function run() {
      if (token && type === 'verify') {
        await verifyEmail(token).catch(() => {});
      }
      await refreshAuth();
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/auth/login', { replace: true });
      return;
    }
    const pendingInviteToken = consumePendingInviteToken();
    navigate(pendingInviteToken ? `/invite/${pendingInviteToken}` : '/', { replace: true });
  }, [isLoading, user, navigate]);

  return <FullPageSpinner />;
}
