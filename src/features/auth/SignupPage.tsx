import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { signInWithGoogle, signUpWithEmail } from './api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FormValues {
  fullName: string;
  email: string;
  password: string;
}

export function SignupPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      await signUpWithEmail(values.email, values.password, values.fullName);
      setSubmittedEmail(values.email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign up.');
    }
  };

  if (submittedEmail) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <p className="text-sm text-text-muted">
            We sent a verification link to <span className="font-medium text-text">{submittedEmail}</span>.
            Confirm your email to finish creating your account.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start planning your wedding">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Name is required' })}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
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
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
