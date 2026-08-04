import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { consumePendingInviteToken } from '@/lib/pendingInvite';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/auth/login', { replace: true });
        return;
      }
      const pendingInviteToken = consumePendingInviteToken();
      navigate(pendingInviteToken ? `/invite/${pendingInviteToken}` : '/', { replace: true });
    });
  }, [navigate]);

  return <FullPageSpinner />;
}
