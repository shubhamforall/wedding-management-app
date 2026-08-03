import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/' : '/auth/login', { replace: true });
    });
  }, [navigate]);

  return <FullPageSpinner />;
}
