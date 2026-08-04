import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthLayout } from './AuthLayout';
import { signInWithEmail, signInWithGoogle } from './api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { consumePendingInviteToken } from '@/lib/pendingInvite';

interface FormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      await signInWithEmail(values.email, values.password);
      const pendingInviteToken = consumePendingInviteToken();
      navigate(pendingInviteToken ? `/invite/${pendingInviteToken}` : redirectTo, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign in.');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your wedding">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <div className="flex justify-end">
          <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-faint">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="secondary" className="w-full" onClick={() => signInWithGoogle()} type="button">
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
